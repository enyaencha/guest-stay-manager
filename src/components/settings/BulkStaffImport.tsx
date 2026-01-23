import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react";
import { useCreateStaff, useRoles } from "@/hooks/useStaff";
import { useLogAudit } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportRow {
  name: string;
  email: string;
  phone: string;
  department: string;
  employment_type: "permanent" | "temporary";
  contract_end_date?: string;
  role?: string;
  status: "valid" | "error" | "imported";
  error?: string;
}

const DEFAULT_PASSWORD = "HAVEN2026";

export function BulkStaffImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [defaultRole, setDefaultRole] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: roles = [] } = useRoles();
  const createStaff = useCreateStaff();
  const logAudit = useLogAudit();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];

        const parsed: ImportRow[] = data.map((row) => {
          const errors: string[] = [];
          
          if (!row.name || typeof row.name !== "string") {
            errors.push("Name is required");
          }
          if (!row.department || typeof row.department !== "string") {
            errors.push("Department is required");
          }
          
          const employmentType = (row.employment_type || "permanent").toLowerCase();
          if (!["permanent", "temporary"].includes(employmentType)) {
            errors.push("Employment type must be 'permanent' or 'temporary'");
          }

          return {
            name: row.name || "",
            email: row.email || "",
            phone: row.phone || "",
            department: row.department || "",
            employment_type: employmentType as "permanent" | "temporary",
            contract_end_date: row.contract_end_date || undefined,
            role: row.role || "",
            status: errors.length > 0 ? "error" : "valid",
            error: errors.length > 0 ? errors.join(", ") : undefined,
          };
        });

        setImportData(parsed);
        setImportComplete(false);
        toast.success(`Loaded ${parsed.length} rows from file`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validRows = importData.filter((row) => row.status === "valid");
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    const updatedData = [...importData];

    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];
      if (row.status !== "valid") continue;

      try {
        // Create staff record
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .insert({
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            department: row.department,
            employment_type: row.employment_type,
            contract_end_date: row.contract_end_date || null,
            status: "active",
          })
          .select()
          .single();

        if (staffError) throw staffError;

        // If email provided, create auth user with default password
        if (row.email) {
          const { data: authData, error: authError } = await supabase.auth.admin?.createUser?.({
            email: row.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: row.name },
          }) || { data: null, error: new Error("Admin API not available") };

          // If admin API not available, we'll skip user creation
          // The admin can link users manually later
          if (authData?.user) {
            // Link user to staff
            await supabase
              .from("staff")
              .update({ user_id: authData.user.id })
              .eq("id", staffData.id);

            // Set password reset required
            await supabase
              .from("profiles")
              .update({ password_reset_required: true })
              .eq("user_id", authData.user.id);

            // Assign role if specified
            const roleToAssign = row.role || defaultRole;
            if (roleToAssign) {
              const role = roles.find(
                (r) => r.name.toLowerCase() === roleToAssign.toLowerCase()
              );
              if (role) {
                await supabase.from("user_roles").insert({
                  user_id: authData.user.id,
                  role_id: role.id,
                  is_active: true,
                });
              }
            }
          }
        }

        // Log audit
        await logAudit.mutateAsync({
          action: "staff_created",
          entityType: "staff",
          entityId: staffData.id,
          newValues: {
            name: row.name,
            department: row.department,
            employment_type: row.employment_type,
          },
          metadata: {
            staff_name: row.name,
            import_method: "bulk",
          },
        });

        updatedData[i] = { ...row, status: "imported" };
        successCount++;
      } catch (error: any) {
        console.error("Error importing row:", error);
        updatedData[i] = {
          ...row,
          status: "error",
          error: error.message || "Import failed",
        };
        failCount++;
      }
    }

    setImportData(updatedData);
    setImportComplete(true);
    setIsImporting(false);

    // Log bulk import summary
    if (successCount > 0) {
      await logAudit.mutateAsync({
        action: "bulk_import",
        entityType: "staff",
        entityId: crypto.randomUUID(),
        metadata: {
          count: successCount,
          failed: failCount,
        },
      });
    }

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} staff members`);
    }
    if (failCount > 0) {
      toast.error(`Failed to import ${failCount} rows`);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "+254700000000",
        department: "Front Desk",
        employment_type: "permanent",
        contract_end_date: "",
        role: "Front Desk",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+254711111111",
        department: "Housekeeping",
        employment_type: "temporary",
        contract_end_date: "2026-03-31",
        role: "Housekeeping Supervisor",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff Template");
    XLSX.writeFile(wb, "staff_import_template.xlsx");
  };

  const resetImport = () => {
    setImportData([]);
    setImportComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = importData.filter((r) => r.status === "valid").length;
  const errorCount = importData.filter((r) => r.status === "error").length;
  const importedCount = importData.filter((r) => r.status === "imported").length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Staff Import
          </DialogTitle>
          <DialogDescription>
            Import multiple staff members from an Excel or CSV file. Users will be created with default password "HAVEN2026" and required to reset on first login.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {importData.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Upload File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an Excel (.xlsx) or CSV file with staff data
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Select File
                      </label>
                    </Button>
                    <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    Valid: {validCount}
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600">
                    Errors: {errorCount}
                  </Badge>
                  {importedCount > 0 && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                      Imported: {importedCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label>Default Role:</Label>
                  <Select value={defaultRole} onValueChange={setDefaultRole}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {row.status === "valid" && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">
                              Valid
                            </Badge>
                          )}
                          {row.status === "error" && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-600">
                              Error
                            </Badge>
                          )}
                          {row.status === "imported" && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.email || "-"}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {row.employment_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.role || defaultRole || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {errorCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorCount} row(s) have errors and will be skipped during import.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {importData.length > 0 && (
            <>
              <Button variant="outline" onClick={resetImport}>
                Reset
              </Button>
              {!importComplete && (
                <Button
                  onClick={handleImport}
                  disabled={isImporting || validCount === 0}
                >
                  {isImporting ? "Importing..." : `Import ${validCount} Staff`}
                </Button>
              )}
              {importComplete && (
                <Button onClick={() => setIsOpen(false)}>Done</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
