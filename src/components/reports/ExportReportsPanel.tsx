import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileSpreadsheet, 
  Download, 
  Calendar,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Building
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  exportToExcel,
  generateRevenueReport,
  generateOccupancyReport,
  generateInventoryReport,
  generateExpenseReport,
  generatePOSSalesReport,
  generateDepartmentReport,
  generateMonthlyReport,
} from "@/lib/excelExport";
import { InventoryItem } from "@/hooks/useInventory";
import { FinanceTransaction } from "@/hooks/useFinance";
import { POSTransaction } from "@/hooks/usePOS";
import { RevenueData, OccupancyData, DepartmentStats, TopItem } from "@/types/report";
import { format } from "date-fns";

interface ReportOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ExportReportsPanelProps {
  revenueData: RevenueData[];
  occupancyData: OccupancyData[];
  inventoryItems: InventoryItem[];
  expenseTransactions: FinanceTransaction[];
  posTransactions: POSTransaction[];
  topItems: TopItem[];
  departmentStats: DepartmentStats[];
  roomBreakdown: { type: string; rooms: number; rate: number; nights: number; revenue: number }[];
  totalRooms: number;
  periodLabel: string;
}

const reportOptions: ReportOption[] = [
  {
    id: "revenue",
    label: "Revenue Report",
    icon: <DollarSign className="h-4 w-4" />,
    description: "Daily revenue breakdown by room and POS sales",
  },
  {
    id: "occupancy",
    label: "Occupancy Report",
    icon: <Calendar className="h-4 w-4" />,
    description: "Room occupancy rates and trends",
  },
  {
    id: "inventory",
    label: "Inventory Report",
    icon: <Package className="h-4 w-4" />,
    description: "Stock levels, movements, and valuations",
  },
  {
    id: "expenses",
    label: "Expense Report",
    icon: <DollarSign className="h-4 w-4" />,
    description: "Expense breakdown with eTIMS classification",
  },
  {
    id: "pos",
    label: "POS Sales Report",
    icon: <ShoppingCart className="h-4 w-4" />,
    description: "Point of sale transactions and top items",
  },
  {
    id: "department",
    label: "Department Performance",
    icon: <Users className="h-4 w-4" />,
    description: "Department tasks and satisfaction metrics",
  },
  {
    id: "monthly",
    label: "Monthly Summary",
    icon: <Building className="h-4 w-4" />,
    description: "Comprehensive monthly report with all metrics",
  },
];

export const ExportReportsPanel = ({
  revenueData,
  occupancyData,
  inventoryItems,
  expenseTransactions,
  posTransactions,
  topItems,
  departmentStats,
  roomBreakdown,
  totalRooms,
  periodLabel,
}: ExportReportsPanelProps) => {
  const [selectedReports, setSelectedReports] = useState<string[]>(["monthly"]);
  const [period, setPeriod] = useState("current");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const periodTitle = useMemo(() => {
    if (period === "current") return periodLabel;
    if (period === "30d") return "Last 30 Days";
    if (period === "90d") return "Last 90 Days";
    return periodLabel;
  }, [period, periodLabel]);

  const toggleReport = (reportId: string) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleExport = async () => {
    if (selectedReports.length === 0) {
      toast({
        title: "No Reports Selected",
        description: "Please select at least one report to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Export each selected report
      for (const reportId of selectedReports) {
        const timestamp = new Date().toISOString().split("T")[0];
        
        switch (reportId) {
          case "revenue":
            exportToExcel(
              generateRevenueReport(revenueData, roomBreakdown),
              `Revenue_Report_${timestamp}`
            );
            break;
          case "occupancy":
            exportToExcel(
              generateOccupancyReport(occupancyData, totalRooms),
              `Occupancy_Report_${timestamp}`
            );
            break;
          case "inventory":
            // Map inventory items to the expected format
            const inventoryData = inventoryItems.map(i => ({
              name: i.name,
              category: i.category,
              currentStock: i.current_stock,
              minStock: i.min_stock,
              openingStock: i.opening_stock || 0,
              purchasesIn: i.purchases_in || 0,
              stockOut: i.stock_out || 0,
              unit: i.unit,
              unitPrice: i.unit_cost,
            }));
            exportToExcel(
              generateInventoryReport(inventoryData),
              `Inventory_Report_${timestamp}`
            );
            break;
          case "expenses":
            // Map expense records to the expected format
            const expenseData = expenseTransactions
              .filter((transaction) => transaction.type === "expense")
              .map((transaction) => ({
                category: transaction.category,
                description: transaction.description,
                amount: transaction.amount,
                isEtims: false,
                date: transaction.date,
              }));
            exportToExcel(
              generateExpenseReport(expenseData),
              `Expense_Report_${timestamp}`
            );
            break;
          case "pos":
            const posSales = posTransactions.map((transaction) => ({
              date: format(new Date(transaction.created_at), "yyyy-MM-dd"),
              guestName: transaction.guest_name || "Walk-in",
              roomNumber: transaction.room_number || "Walk-in",
              items: Array.isArray(transaction.items)
                ? (transaction.items as { name: string; quantity: number; price: number }[])
                : [],
              total: transaction.total,
              paymentMethod: transaction.payment_method,
            }));
            exportToExcel(
              generatePOSSalesReport(posSales, topItems),
              `POS_Sales_Report_${timestamp}`
            );
            break;
          case "department":
            exportToExcel(
              generateDepartmentReport(departmentStats),
              `Department_Report_${timestamp}`
            );
            break;
          case "monthly":
            // Map expense records for monthly report
            const monthlyExpenses = expenseTransactions
              .filter((transaction) => transaction.type === "expense")
              .map((transaction) => ({
                category: transaction.category,
                description: transaction.description,
                amount: transaction.amount,
                isEtims: false,
                date: transaction.date,
              }));
            exportToExcel(
              generateMonthlyReport(
                periodTitle,
                revenueData,
                occupancyData,
                departmentStats,
                topItems,
                monthlyExpenses
              ),
              `Monthly_Report_${timestamp}`
            );
            break;
        }
      }

      toast({
        title: "Export Successful",
        description: `${selectedReports.length} report(s) exported to Excel.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the reports.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectAll = () => {
    setSelectedReports(reportOptions.map((r) => r.id));
  };

  const clearAll = () => {
    setSelectedReports([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Reports to Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="flex items-center gap-4">
          <Label>Report Period:</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">{periodLabel}</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Select Reports:</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {reportOptions.map((report) => (
              <div
                key={report.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReports.includes(report.id)
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
                onClick={() => toggleReport(report.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={() => toggleReport(report.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {report.icon}
                      <span className="font-medium">{report.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleExport}
          disabled={isExporting || selectedReports.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting
            ? "Exporting..."
            : `Export ${selectedReports.length} Report(s)`}
        </Button>
      </CardContent>
    </Card>
  );
};
