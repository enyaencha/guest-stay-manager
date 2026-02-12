import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { FinanceOverviewChart } from "@/components/finance/FinanceOverviewChart";
import { CategoryBreakdownCard } from "@/components/finance/CategoryBreakdownCard";
import { TransactionHistoryTable } from "@/components/finance/TransactionHistoryTable";
import { POSSalesTable } from "@/components/finance/POSSalesTable";
import { RoomAmenityCostsTable } from "@/components/finance/RoomAmenityCostsTable";
import { SalaryManagement } from "@/components/finance/SalaryManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  BedDouble,
  Loader2
} from "lucide-react";
import { 
  useFinanceTransactions, 
  calculateFinanceSummary, 
  calculateCategoryBreakdown,
  type FinanceTransaction,
} from "@/hooks/useFinance";
import { usePOSTransactions } from "@/hooks/usePOS";
import { formatKsh } from "@/lib/formatters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInventoryItems } from "@/hooks/useInventory";
import { endOfDay, format, parseISO, startOfDay, subDays, isWithinInterval } from "date-fns";
import { useTabQueryParam } from "@/hooks/useTabQueryParam";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const FINANCE_RANGES = ["today", "7d", "30d", "90d", "1y", "custom"] as const;

type DateRange = {
  start: Date;
  end: Date;
  dayStart: Date;
  dayEnd: Date;
};

type ApprovedRefund = {
  id: string;
  booking_id: string;
  room_number: string;
  refund_amount: number;
  reason: string;
  approved_at: string | null;
  guest_name: string | null;
};

const REFUND_PAYOUT_METHODS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
];

const buildRange = (start: Date, end: Date): DateRange => {
  let rangeStart = start;
  let rangeEnd = end;

  if (rangeStart > rangeEnd) {
    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
  }

  return {
    start: rangeStart,
    end: rangeEnd,
    dayStart: startOfDay(rangeStart),
    dayEnd: endOfDay(rangeEnd),
  };
};

const formatDateTimeLocal = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

export default function Finance() {
  const { hasPermission } = useAuth();
  const canManageFinance = hasPermission("finance.manage");
  const [activeTab, setActiveTab] = useTabQueryParam({
    key: "tab",
    defaultValue: "overview",
    allowed: ["overview", "transactions", "pos-sales", "room-costs", "salaries"],
  });
  const [dateRange, setDateRange] = useState<(typeof FINANCE_RANGES)[number]>("30d");
  const [customStart, setCustomStart] = useState(() =>
    formatDateTimeLocal(subDays(new Date(), 6))
  );
  const [customEnd, setCustomEnd] = useState(() =>
    formatDateTimeLocal(new Date())
  );
  const queryClient = useQueryClient();
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<ApprovedRefund | null>(null);
  const [payoutMethod, setPayoutMethod] = useState(REFUND_PAYOUT_METHODS[0].value);
  const [payoutDate, setPayoutDate] = useState(() => formatDateTimeLocal(new Date()));
  const [payoutReference, setPayoutReference] = useState("");
  const [payoutRecipient, setPayoutRecipient] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  
  const { data: transactions = [], isLoading: transactionsLoading } = useFinanceTransactions();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();
  
  const { data: housekeepingTasks = [], isLoading: housekeepingLoading } = useQuery({
    queryKey: ["housekeeping_tasks_costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .select("id, room_number, assigned_to_name, actual_added, completed_at, updated_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: approvedRefunds = [], isLoading: refundsLoading } = useQuery({
    queryKey: ["approved_refunds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("id, booking_id, room_number, refund_amount, reason, approved_at, guests(name)")
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((refund: any) => ({
        id: refund.id,
        booking_id: refund.booking_id,
        room_number: refund.room_number,
        refund_amount: Number(refund.refund_amount) || 0,
        reason: refund.reason,
        approved_at: refund.approved_at,
        guest_name: refund.guests?.name ?? null,
      })) as ApprovedRefund[];
    },
  });

  const recordRefundPayout = useMutation({
    mutationFn: async (payload: {
      refund: ApprovedRefund;
      paymentMethod: string;
      reference: string;
      payoutDate: string;
      recipient: string;
      notes: string;
    }) => {
      const { refund, paymentMethod, reference, payoutDate, recipient, notes } = payload;
      const descriptionParts = [
        `Guest refund payout - ${refund.guest_name || "Guest"} (Room ${refund.room_number})`,
        recipient ? `Recipient: ${recipient}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean);
      const payoutDateIso = payoutDate ? new Date(payoutDate).toISOString() : new Date().toISOString();
      const { error } = await supabase
        .from("finance_transactions")
        .insert({
          type: "expense",
          category: "refund",
          description: descriptionParts.join(" | "),
          amount: refund.refund_amount,
          payment_status: "paid",
          payment_method: paymentMethod,
          reference: reference || `refund:${refund.id}`,
          booking_id: refund.booking_id,
          room_number: refund.room_number,
          refund_request_id: refund.id,
          vendor: recipient || refund.guest_name || null,
          date: payoutDateIso,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Refund payout recorded");
      queryClient.invalidateQueries({ queryKey: ["finance_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["approved_refunds"] });
      queryClient.invalidateQueries({ queryKey: ["refund_requests_processed"] });
      setPayoutOpen(false);
      setSelectedRefund(null);
      setPayoutReference("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record refund payout");
    },
  });

  const isCustomRange = dateRange === "custom";
  const openPayoutDialog = (refund: ApprovedRefund) => {
    setSelectedRefund(refund);
    setPayoutMethod(REFUND_PAYOUT_METHODS[0].value);
    setPayoutDate(formatDateTimeLocal(new Date()));
    setPayoutReference("");
    setPayoutRecipient("");
    setPayoutNotes("");
    setPayoutOpen(true);
  };

  const handleRecordPayout = () => {
    if (!selectedRefund || !canManageFinance) {
      if (!canManageFinance) {
        toast.error("You need finance manager permission to record payouts.");
      }
      return;
    }
    recordRefundPayout.mutate({
      refund: selectedRefund,
      paymentMethod: payoutMethod,
      reference: payoutReference.trim(),
      payoutDate: payoutDate.trim(),
      recipient: payoutRecipient.trim(),
      notes: payoutNotes.trim(),
    });
  };

  const rangeDays =
    dateRange === "today"
      ? 1
      : dateRange === "7d"
        ? 7
        : dateRange === "30d"
          ? 30
          : dateRange === "90d"
            ? 90
            : dateRange === "custom"
              ? 7
              : 365;

  const now = new Date();
  const parsedCustomStart = customStart ? parseISO(customStart) : null;
  const parsedCustomEnd = customEnd ? parseISO(customEnd) : null;

  let rawRangeStart = subDays(now, rangeDays - 1);
  let rawRangeEnd = now;

  if (isCustomRange) {
    if (parsedCustomStart && parsedCustomEnd) {
      rawRangeStart = parsedCustomStart;
      rawRangeEnd = parsedCustomEnd;
    } else if (parsedCustomStart) {
      rawRangeStart = parsedCustomStart;
      rawRangeEnd = now;
    } else if (parsedCustomEnd) {
      rawRangeStart = subDays(parsedCustomEnd, rangeDays - 1);
      rawRangeEnd = parsedCustomEnd;
    }
  } else {
    rawRangeStart = startOfDay(rawRangeStart);
    rawRangeEnd = endOfDay(rawRangeEnd);
  }

  const currentRange = buildRange(rawRangeStart, rawRangeEnd);
  const periodLabel =
    isCustomRange
      ? `${format(currentRange.start, "MMM d, yyyy HH:mm")} - ${format(currentRange.end, "MMM d, yyyy HH:mm")}`
      : dateRange === "today"
        ? "Today"
        : dateRange === "7d"
          ? "Last 7 Days"
          : dateRange === "30d"
            ? "Last 30 Days"
            : dateRange === "90d"
              ? "Last 90 Days"
              : "Last 12 Months";

  const isDateInRange = (value?: string | null) => {
    if (!value) return false;
    const date = parseISO(value);
    return isWithinInterval(date, { start: currentRange.dayStart, end: currentRange.dayEnd });
  };

  const isTimestampInRange = (value?: string | null) => {
    if (!value) return false;
    const date = parseISO(value);
    return isWithinInterval(date, { start: currentRange.start, end: currentRange.end });
  };

  const filteredTransactions = transactions.filter((t) => isDateInRange(t.date));
  const filteredPosTransactions = posTransactions.filter((t) => isTimestampInRange(t.created_at));
  const filteredHousekeepingTasks = housekeepingTasks.filter((task: any) =>
    isTimestampInRange(task.completed_at || task.updated_at || task.created_at)
  );

  const posItemsSummary = (txn: typeof posTransactions[number]) => {
    if (Array.isArray(txn.items)) {
      const summary = (txn.items as { name: string; quantity: number }[])
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(", ");
      if (summary) return summary;
    }
    return txn.notes || "POS sale";
  };

  const posIncomeTransactions: FinanceTransaction[] = filteredPosTransactions
    .filter((t) => t.status === "completed")
    .map((t) => ({
      id: `pos-${t.id}`,
      date: t.created_at,
      type: "income",
      category: "pos-sale",
      description: posItemsSummary(t),
      amount: t.total,
      payment_status: "paid",
      payment_method: t.payment_method,
      reference: `POS-${t.id.slice(0, 8)}`,
      refund_request_id: null,
      room_number: t.room_number,
      booking_id: null,
      vendor: t.staff_name || t.guest_name || null,
      created_by: t.staff_id,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

  const summaryTransactions: FinanceTransaction[] = [...filteredTransactions, ...posIncomeTransactions];
  const baseSummary = calculateFinanceSummary(filteredTransactions);
  const posCompletedTotal = posIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const posPendingTotal = filteredPosTransactions
    .filter((t) => t.status !== "completed")
    .reduce((sum, t) => sum + t.total, 0);

  const summary = {
    totalIncome: baseSummary.totalIncome + posCompletedTotal,
    totalExpenses: baseSummary.totalExpenses,
    netProfit: baseSummary.totalIncome + posCompletedTotal - baseSummary.totalExpenses,
    pendingPayments: baseSummary.pendingPayments + posPendingTotal,
  };

  const incomeBreakdown = calculateCategoryBreakdown(summaryTransactions, "income");
  const expenseBreakdown = calculateCategoryBreakdown(summaryTransactions, "expense");

  const incomeTransactions = summaryTransactions.filter((t) => t.type === "income");
  const expenseTransactions = summaryTransactions.filter((t) => t.type === "expense");

  const totalPOSSales = filteredPosTransactions
    .filter((t) => t.status === "completed")
    .reduce((sum, s) => sum + s.total, 0);

  const inventoryLookup = new Map(
    inventoryItems.map((item) => [item.name.toLowerCase(), item])
  );

  const roomCostsData = filteredHousekeepingTasks.flatMap((task: any) => {
    const addedItems = Array.isArray(task.actual_added) ? task.actual_added : [];
    if (addedItems.length === 0) return [];
    return addedItems.map((amenity: any, index: number) => {
      const inventoryItem = inventoryLookup.get(String(amenity.name || "").toLowerCase());
      const unitCost = inventoryItem ? Number(inventoryItem.unit_cost) : 0;
      const quantity = Number(amenity.quantity ?? 0);
      return {
        id: `${task.id}-${index}`,
        date: task.completed_at || task.updated_at || task.created_at,
        roomNumber: task.room_number,
        itemName: amenity.name || "Unknown item",
        quantity,
        unitCost,
        totalCost: unitCost * quantity,
        isComplimentary: true,
        restockedBy: task.assigned_to_name || "Cleaner",
      };
    });
  });

  const totalAmenityCosts = roomCostsData.reduce((sum, c) => sum + c.totalCost, 0);
  const restockEvents = filteredHousekeepingTasks.filter((task: any) =>
    Array.isArray(task.actual_added) && task.actual_added.length > 0
  ).length;

  // Build real monthly finance data from transactions
  const monthlyFinance = useMemo(() => {
    const byMonth: Record<string, { income: number; expenses: number }> = {};
    
    filteredTransactions.forEach(t => {
      const month = format(parseISO(t.date), "MMM yyyy");
      if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 };
      if (t.type === "income") byMonth[month].income += t.amount;
      else byMonth[month].expenses += t.amount;
    });

    // Also include POS sales as income
    filteredPosTransactions.filter(t => t.status === 'completed').forEach(t => {
      const month = format(parseISO(t.created_at), "MMM yyyy");
      if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 };
      byMonth[month].income += t.total;
    });

    return Object.entries(byMonth)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredTransactions, filteredPosTransactions]);

  const isLoading = transactionsLoading || posLoading || inventoryLoading || housekeepingLoading;

  const financeTableTransactions = filteredTransactions.map(t => ({
    id: t.id, date: t.date, type: t.type as 'income' | 'expense',
    category: t.category, description: t.description, amount: t.amount,
    paymentStatus: t.payment_status as 'paid' | 'pending' | 'overdue',
    paymentMethod: t.payment_method || undefined,
    reference: t.reference || undefined,
    roomNumber: t.room_number || undefined,
    vendor: t.vendor || undefined,
  }));
  const posTableTransactions = filteredPosTransactions.map(t => ({
    id: `pos-${t.id}`,
    date: t.created_at,
    type: "income" as const,
    category: "pos-sale",
    description: posItemsSummary(t),
    amount: t.total,
    paymentStatus: (t.status === "completed" ? "paid" : "pending") as 'paid' | 'pending' | 'overdue',
    paymentMethod: t.payment_method || undefined,
    reference: `POS-${t.id.slice(0, 8)}`,
    roomNumber: t.room_number || undefined,
    vendor: t.staff_name || t.guest_name || undefined,
  }));
  const tableTransactions = [...financeTableTransactions, ...posTableTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const posSalesData = filteredPosTransactions.map(t => ({
    id: t.id, date: t.created_at,
    roomNumber: t.room_number || 'Walk-in',
    items: Array.isArray(t.items) ? (t.items as { name: string; quantity: number; price: number }[]).map(i => i.name).join(', ') : '',
    totalAmount: t.total,
    paymentMethod: t.status === "pending" ? `${t.payment_method} (pending)` : t.payment_method,
    staffName: t.staff_name || 'Unknown',
  }));

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finance</h1>
            <p className="text-muted-foreground text-sm">
              Track revenue, expenses, and financial performance
            </p>
            <p className="text-xs text-muted-foreground">Period: {periodLabel}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                <SelectTrigger className="w-full sm:w-[190px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {dateRange === "custom" && (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="finance-start">Start date &amp; time</Label>
                    <Input
                      id="finance-start"
                      type="datetime-local"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="finance-end">End date &amp; time</Label>
                    <Input
                      id="finance-end"
                      type="datetime-local"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-2 w-fit">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Income" value={formatKsh(summary.totalIncome)} subtitle="All income" icon={TrendingUp} iconClassName="text-status-available" />
              <StatCard title="Total Expenses" value={formatKsh(summary.totalExpenses)} subtitle="All expenses" icon={TrendingDown} iconClassName="text-status-maintenance" />
              <StatCard title="Net Profit" value={formatKsh(summary.netProfit)} subtitle="Income - Expenses" icon={Wallet} iconClassName="text-primary" />
              <StatCard title="Pending Payments" value={formatKsh(summary.pendingPayments)} subtitle="Awaiting settlement" icon={AlertCircle} iconClassName="text-status-checkout" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-status-available/10"><Receipt className="h-5 w-5 text-status-available" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">POS Sales</p>
                  <p className="font-semibold text-foreground">{formatKsh(totalPOSSales)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-status-maintenance/10"><BedDouble className="h-5 w-5 text-status-maintenance" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Room Amenity Costs</p>
                  <p className="font-semibold text-foreground">{formatKsh(totalAmenityCosts)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-primary/10"><ArrowUpRight className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Income Transactions</p>
                  <p className="font-semibold text-foreground">{incomeTransactions.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-status-checkout/10"><ArrowDownLeft className="h-5 w-5 text-status-checkout" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Expense Transactions</p>
                  <p className="font-semibold text-foreground">{expenseTransactions.length}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                <TabsTrigger value="pos-sales">POS Sales</TabsTrigger>
                <TabsTrigger value="room-costs">Room Costs</TabsTrigger>
                <TabsTrigger value="salaries">Salaries</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <FinanceOverviewChart data={monthlyFinance} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdownCard title="Income by Category" data={incomeBreakdown} colorClass="[&>div]:bg-status-available" />
                  <CategoryBreakdownCard title="Expenses by Category" data={expenseBreakdown} colorClass="[&>div]:bg-status-maintenance" />
                </div>
                <TransactionHistoryTable transactions={tableTransactions.slice(0, 8)} />
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">Refund Payouts</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Approved refunds awaiting finance payout entry.
                      </p>
                    </div>
                    <Badge variant="outline">
                      {approvedRefunds.length} pending
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {refundsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading approved refunds...
                      </div>
                    ) : approvedRefunds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No approved refunds awaiting payout.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {approvedRefunds.map((refund) => {
                          const approvedLabel = refund.approved_at
                            ? `Approved ${format(parseISO(refund.approved_at), "MMM d, yyyy HH:mm")}`
                            : "Approved";
                          return (
                            <div
                              key={refund.id}
                              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-medium">
                                  {refund.guest_name || "Guest"} · Room {refund.room_number}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {approvedLabel}
                                  {refund.reason ? ` · ${refund.reason}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">
                                  {formatKsh(refund.refund_amount)}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => openPayoutDialog(refund)}
                                  disabled={!canManageFinance || recordRefundPayout.isPending}
                                  title={
                                    canManageFinance
                                      ? "Record payout"
                                      : "Finance manager permission required"
                                  }
                                >
                                  Record Payout
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdownCard title="Income by Category" data={incomeBreakdown} colorClass="[&>div]:bg-status-available" />
                  <CategoryBreakdownCard title="Expenses by Category" data={expenseBreakdown} colorClass="[&>div]:bg-status-maintenance" />
                </div>
                <TransactionHistoryTable transactions={tableTransactions} />
              </TabsContent>

              <TabsContent value="pos-sales" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-available/10"><Receipt className="h-5 w-5 text-status-available" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total POS Revenue</p>
                      <p className="font-bold text-lg text-foreground">{formatKsh(totalPOSSales)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-primary/10"><ArrowUpRight className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="font-bold text-lg text-foreground">{posSalesData.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-checkout/10"><Wallet className="h-5 w-5 text-status-checkout" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                      <p className="font-bold text-lg text-foreground">
                        {formatKsh(posSalesData.length > 0 ? Math.round(totalPOSSales / posSalesData.length) : 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <POSSalesTable sales={posSalesData} />
              </TabsContent>

              <TabsContent value="room-costs" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-maintenance/10"><BedDouble className="h-5 w-5 text-status-maintenance" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amenity Costs</p>
                      <p className="font-bold text-lg text-foreground">{formatKsh(totalAmenityCosts)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-primary/10"><Receipt className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Restock Events</p>
                      <p className="font-bold text-lg text-foreground">{restockEvents}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-checkout/10"><Wallet className="h-5 w-5 text-status-checkout" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Cost per Restock</p>
                      <p className="font-bold text-lg text-foreground">
                        {formatKsh(roomCostsData.length > 0 ? Math.round(totalAmenityCosts / roomCostsData.length) : 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <RoomAmenityCostsTable costs={roomCostsData} />
              </TabsContent>

              <TabsContent value="salaries" className="space-y-6">
                <SalaryManagement />
              </TabsContent>
            </Tabs>
            <Dialog
              open={payoutOpen}
              onOpenChange={(open) => {
                setPayoutOpen(open);
                if (!open) {
                  setSelectedRefund(null);
                  setPayoutReference("");
                  setPayoutRecipient("");
                  setPayoutNotes("");
                  setPayoutDate(formatDateTimeLocal(new Date()));
                }
              }}
            >
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Record Refund Payout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      {selectedRefund?.guest_name || "Guest"} · Room {selectedRefund?.room_number || "-"}
                    </p>
                    <p className="text-muted-foreground">
                      Refund amount: {formatKsh(selectedRefund?.refund_amount || 0)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refund-payout-method">Payment method</Label>
                    <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                      <SelectTrigger id="refund-payout-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {REFUND_PAYOUT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refund-payout-date">Payout date &amp; time</Label>
                    <Input
                      id="refund-payout-date"
                      type="datetime-local"
                      value={payoutDate}
                      onChange={(event) => setPayoutDate(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refund-payout-reference">Reference (optional)</Label>
                    <Input
                      id="refund-payout-reference"
                      value={payoutReference}
                      onChange={(event) => setPayoutReference(event.target.value)}
                      placeholder="e.g., M-Pesa code or bank reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refund-payout-recipient">Recipient details (optional)</Label>
                    <Input
                      id="refund-payout-recipient"
                      value={payoutRecipient}
                      onChange={(event) => setPayoutRecipient(event.target.value)}
                      placeholder="Recipient name or account"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refund-payout-notes">Notes (optional)</Label>
                    <Textarea
                      id="refund-payout-notes"
                      value={payoutNotes}
                      onChange={(event) => setPayoutNotes(event.target.value)}
                      placeholder="Add payout notes for audit trail"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPayoutOpen(false)}
                      disabled={recordRefundPayout.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRecordPayout}
                      disabled={!selectedRefund || !canManageFinance || recordRefundPayout.isPending}
                    >
                      {recordRefundPayout.isPending ? "Recording..." : "Record Payout"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </MainLayout>
  );
}
