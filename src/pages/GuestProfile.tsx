import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { formatKsh } from "@/lib/formatters";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  FileText,
  Phone,
  Mail,
  User,
  Receipt,
  Camera,
  UploadCloud,
  FileSpreadsheet,
} from "lucide-react";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "—";

const GuestProfile = () => {
  const navigate = useNavigate();
  const { guestId } = useParams();
  const queryClient = useQueryClient();

  const { data: guest, isLoading: guestLoading } = useQuery({
    queryKey: ["guest-profile", guestId],
    queryFn: async () => {
      if (!guestId) return null;
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("id", guestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!guestId,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["guest-profile-bookings", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("guest_id", guestId)
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });

  const roomNumbers = useMemo(
    () =>
      Array.from(
        new Set(
          bookings
            .map((booking) => booking.room_number)
            .filter((room): room is string => !!room)
        )
      ),
    [bookings]
  );

  const { data: posTransactions = [], isLoading: posLoading } = useQuery({
    queryKey: ["guest-profile-pos", guestId, roomNumbers],
    queryFn: async () => {
      if (!guestId) return [];
      let query = supabase.from("pos_transactions").select("*").order("created_at", {
        ascending: false,
      });
      if (roomNumbers.length > 0) {
        query = query.or(
          `guest_id.eq.${guestId},room_number.in.(${roomNumbers.join(",")})`
        );
      } else {
        query = query.eq("guest_id", guestId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["guest-profile-assessments", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from("room_assessments")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });

  const { data: refunds = [], isLoading: refundsLoading } = useQuery({
    queryKey: ["guest-profile-refunds", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["guest-profile-issues", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from("guest_issues")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });

  const { data: guestUploads = [], isLoading: uploadsLoading } = useQuery({
    queryKey: ["guest-profile-uploads", guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from("guest_uploads" as any)
        .select("*")
        .eq("guest_id", guestId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });

  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isLoading =
    guestLoading ||
    bookingsLoading ||
    posLoading ||
    assessmentsLoading ||
    refundsLoading ||
    issuesLoading ||
    uploadsLoading;

  const handleUpload = async () => {
    if (!guestId || !selectedFile) return;
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop() || "file";
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `guest-${guestId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("guest-docs")
        .upload(filePath, selectedFile, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("guest-docs").getPublicUrl(filePath);
      const { error: insertError } = await supabase
        .from("guest_uploads" as any)
        .insert({
          guest_id: guestId,
          file_url: data.publicUrl,
          file_name: selectedFile.name,
          file_type: selectedFile.type || fileExt,
        });
      if (insertError) throw insertError;
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: ["guest-profile-uploads", guestId] });
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const printBookingDoc = (booking: any, kind: "invoice" | "receipt") => {
    const bookingPos = posTransactions.filter(
      (txn) =>
        (txn.guest_id && txn.guest_id === guestId) ||
        (booking.room_number && txn.room_number === booking.room_number)
    );
    const posTotal = bookingPos.reduce(
      (sum, txn) => sum + (Number(txn.total) || 0),
      0
    );
    const totalDue = (Number(booking.total_amount) || 0) + posTotal;
    const paidAmount = Number(booking.paid_amount) || 0;
    const balance = totalDue - paidAmount;

    const posLines = bookingPos
      .flatMap((txn) => {
        const items = Array.isArray(txn.items) && txn.items.length > 0
          ? (txn.items as { name: string; quantity: number; price: number; lot_label?: string; lot_expiry?: string }[])
          : [{ name: "POS Items", quantity: 1, price: Number(txn.total) || 0 }];

        const itemRows = items.map((item) => {
          const lotMeta = item.lot_label ? ` • ${item.lot_label}` : "";
          const expMeta = item.lot_expiry ? ` • Exp ${item.lot_expiry}` : "";
          const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
          return `<tr><td>${formatDateTime(txn.created_at)}</td><td>${item.quantity}x ${item.name}${lotMeta}${expMeta}</td><td class="right">${formatKsh(lineTotal)}</td></tr>`;
        });

        const taxRow = txn.tax && Number(txn.tax) > 0
          ? [
              `<tr><td>${formatDateTime(txn.created_at)}</td><td>Tax (10%)</td><td class="right">${formatKsh(Number(txn.tax) || 0)}</td></tr>`,
            ]
          : [];

        return [...itemRows, ...taxRow];
      })
      .join("");

    const title = kind === "invoice" ? "Invoice" : "Receipt";

    const html = `
      <html>
        <head>
          <title>${title} - ${guest?.name || "Guest"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 6px; }
            .muted { color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; font-size: 13px; }
            th { text-align: left; background: #f8fafc; }
            .right { text-align: right; }
            .total { font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="muted">Guest: ${guest?.name || "Guest"} • Room ${booking.room_number || "—"}</div>
          <div class="muted">Stay: ${formatDateTime(booking.check_in)} - ${formatDateTime(booking.check_out)}</div>
          <table>
            <thead>
              <tr><th>Item</th><th>Details</th><th class="right">Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Room</td>
                <td>${booking.room_type || "Room"} • ${formatDate(booking.check_in)} - ${formatDate(booking.check_out)}</td>
                <td class="right">${formatKsh(Number(booking.total_amount) || 0)}</td>
              </tr>
              ${posLines || `<tr><td colspan="3" class="muted">No POS charges</td></tr>`}
              <tr class="total">
                <td>Total</td>
                <td></td>
                <td class="right">${formatKsh(totalDue)}</td>
              </tr>
              <tr>
                <td>Paid</td>
                <td></td>
                <td class="right">${formatKsh(paidAmount)}</td>
              </tr>
              <tr>
                <td>${balance <= 0 ? "Overpayment" : "Balance"}</td>
                <td></td>
                <td class="right">${formatKsh(Math.abs(balance))}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/dashboard")}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/guests")}>
                Guests
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{guest?.name || "Guest Profile"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => navigate("/guests")}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Guests
              </Button>
            </div>
            <h1 className="text-2xl font-bold">Guest Profile</h1>
            <p className="text-muted-foreground">
              Full history, uploads, and billing for this guest.
            </p>
          </div>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading guest profile...
            </CardContent>
          </Card>
        )}

        {!isLoading && !guest && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Guest not found.
            </CardContent>
          </Card>
        )}

        {!isLoading && guest && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadCloud className="h-5 w-5" />
                    Guest Uploads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <input
                      type="file"
                      className="text-sm"
                      onChange={(event) =>
                        setSelectedFile(event.target.files?.[0] || null)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                    >
                      {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                    {selectedFile && (
                      <div className="text-xs text-muted-foreground">
                        Selected: {selectedFile.name}
                      </div>
                    )}
                  </div>

                  {guestUploads.length === 0 && (
                    <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                  )}
                  {guestUploads.map((upload: any) => (
                    <div key={upload.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{upload.file_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(upload.uploaded_at)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{upload.file_type}</div>
                      <a
                        href={upload.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary"
                      >
                        View document
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {guest.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{guest.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{guest.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>ID: {guest.id_number || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDateTime(guest.created_at)}</span>
                    </div>
                  </div>
                  {(guest as any).id_photo_url && (
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Camera className="h-4 w-4" />
                        ID Upload
                      </div>
                      <div className="flex items-center gap-4">
                        <img
                          src={(guest as any).id_photo_url}
                          alt={`ID for ${guest.name}`}
                          className="h-24 w-36 rounded-md border object-cover"
                        />
                        <a
                          href={(guest as any).id_photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary"
                        >
                          View full size
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Booking History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookings.length === 0 && (
                    <p className="text-sm text-muted-foreground">No bookings found.</p>
                  )}
                  {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold">
                            Room {booking.room_number || "—"} • {booking.room_type || "Room"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(booking.check_in)} → {formatDateTime(booking.check_out)}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Receipt className="h-4 w-4" />
                          <span>Total {formatKsh(Number(booking.total_amount) || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Paid {formatKsh(Number(booking.paid_amount) || 0)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Guests: {booking.guests_count || 1}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printBookingDoc(booking, "invoice")}
                        >
                          Print Invoice
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printBookingDoc(booking, "receipt")}
                        >
                          Print Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    POS Charges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {posTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No POS transactions.</p>
                  )}
                  {posTransactions.map((txn) => (
                    <div key={txn.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatDateTime(txn.created_at)}</span>
                        <Badge variant="outline" className="capitalize">
                          {txn.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">{txn.room_number || "No room"}</div>
                      <div className="font-semibold">{formatKsh(Number(txn.total) || 0)}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Room Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assessments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No assessments recorded.</p>
                  )}
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="rounded-lg border p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatDateTime(assessment.created_at)}</span>
                        <Badge variant="outline" className="capitalize">
                          {assessment.overall_condition}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        Damages: {assessment.damages_found ? "Yes" : "No"}
                      </div>
                      <div className="text-muted-foreground">
                        Damage cost: {formatKsh(Number(assessment.damage_cost) || 0)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Refund Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {refunds.length === 0 && (
                    <p className="text-sm text-muted-foreground">No refund requests.</p>
                  )}
                  {refunds.map((refund) => (
                    <div key={refund.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatDateTime(refund.created_at)}</span>
                        <Badge variant="outline" className="capitalize">
                          {refund.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        Amount: {formatKsh(Number(refund.refund_amount) || 0)}
                      </div>
                      {refund.reason && (
                        <div className="text-muted-foreground">Reason: {refund.reason}</div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Guest Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {issues.length === 0 && (
                    <p className="text-sm text-muted-foreground">No issues logged.</p>
                  )}
                  {issues.map((issue) => (
                    <div key={issue.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{issue.issue_type}</span>
                        <Badge variant="outline" className="capitalize">
                          {issue.resolved ? "resolved" : "pending"}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">{issue.description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default GuestProfile;
