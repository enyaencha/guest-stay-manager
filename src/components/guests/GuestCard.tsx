import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Guest } from "@/types/guest";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKsh } from "@/lib/formatters";
import { format, parseISO, isValid } from "date-fns";
import { RefundRequestModal } from "@/components/refunds/RefundRequestModal";
import { usePropertySettings } from "@/hooks/useSettings";
import { 
  User, 
  UserCircle,
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  CreditCard,
  MoreVertical,
  Eye,
  MessageSquare,
  Receipt,
  LogOut,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface GuestCardProps {
  guest: Guest;
  onCheckIn?: (id: string) => void;
  onCheckOut?: (id: string) => void;
  onRecordPayment?: (id: string, amount: number, method: "mpesa" | "withdraw" | "card" | "bank-transfer") => void;
}

const statusConfig: Record<Guest["status"], { label: string; className: string }> = {
  "pre-arrival": { label: "Pre-Arrival", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  "checked-in": { label: "Checked In", className: "bg-status-occupied/20 text-status-occupied" },
  "checked-out": { label: "Checked Out", className: "bg-muted text-muted-foreground" },
  "no-show": { label: "No Show", className: "bg-status-maintenance/20 text-status-maintenance" },
  "cancelled": { label: "Cancelled", className: "bg-destructive/20 text-destructive" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "MMM d, yyyy • HH:mm");
};

export const GuestCard = ({ guest, onCheckIn, onCheckOut, onRecordPayment }: GuestCardProps) => {
  const navigate = useNavigate();
  const { data: propertySettings } = usePropertySettings();
  const [showDetails, setShowDetails] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showOverpayRefund, setShowOverpayRefund] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "withdraw" | "card" | "bank-transfer">("mpesa");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const status = statusConfig[guest.status];
  const paidAmount = guest.paidAmount ?? 0;
  const totalAmount = guest.totalAmount ?? 0;
  const guestCount = guest.guests ?? 1;
  const paymentStatus = paidAmount >= totalAmount ? "Paid" : "Partial";
  const paymentColor = paymentStatus === "Paid" 
    ? "bg-status-available/20 text-status-available" 
    : "bg-status-checkout/20 text-status-checkout";
  const hasAssessmentFlags = !!guest.lastAssessment && (guest.lastAssessment.damagesFound || guest.lastAssessment.missingItemsCount > 0);
  const assessmentBadge = hasAssessmentFlags
    ? "bg-destructive/20 text-destructive"
    : guest.lastAssessment
      ? "bg-status-available/20 text-status-available"
      : "bg-muted text-muted-foreground";
  const assessmentCost =
    (guest.lastAssessment?.damageCost || 0) + (guest.lastAssessment?.missingCost || 0);
  const posPendingTotal =
    guest.posTransactions
      ?.filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + Number(t.total), 0) || 0;
  const posCompletedTotal =
    guest.posTransactions
      ?.filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.total), 0) || 0;
  const totalDue = Number(totalAmount) + posPendingTotal + assessmentCost;
  const paidTotalRaw = Number(paidAmount) + posCompletedTotal;
  const refundedAmount = guest.refundedAmount ?? 0;
  const paidTotal = Math.max(0, paidTotalRaw - refundedAmount);
  const balanceDue = Math.max(0, totalDue - paidTotal);
  const overpayment = Math.max(0, paidTotal - totalDue);
  const applyPropertySettings = propertySettings?.apply_settings ?? true;
  const propertyName = applyPropertySettings ? propertySettings?.name || "Property" : "Property";
  const propertyAddressLine = applyPropertySettings
    ? [propertySettings?.address, propertySettings?.city, propertySettings?.country].filter(Boolean).join(", ")
    : "";
  const propertyContactLine = applyPropertySettings
    ? [propertySettings?.phone, propertySettings?.email, propertySettings?.website].filter(Boolean).join(" • ")
    : "";
  const propertyLogoUrl = applyPropertySettings ? propertySettings?.logo_url || "" : "";
  const taxPin = applyPropertySettings ? propertySettings?.tax_pin || "" : "";
  const vatRate = applyPropertySettings ? propertySettings?.vat_rate ?? 0 : 0;
  const invoiceFooter = applyPropertySettings ? propertySettings?.invoice_footer || "" : "";
  const paymentStatusCombined =
    overpayment > 0 ? "Overpaid" : paidTotal >= totalDue ? "Paid" : paidTotal > 0 ? "Partial" : "Unpaid";
  const paymentColorCombined =
    paymentStatusCombined === "Paid"
      ? "bg-status-available/20 text-status-available"
      : paymentStatusCombined === "Overpaid"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
        : "bg-status-checkout/20 text-status-checkout";

  const handlePrint = (mode: "invoice" | "receipt") => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const taxLabel = vatRate > 0 ? `VAT (${vatRate}%)` : "Tax";
    const posLines = (guest.posTransactions || [])
      .flatMap((txn) => {
        const items = txn.items && txn.items.length > 0
          ? txn.items
          : [{ name: txn.itemsSummary || "POS Items", quantity: 1, price: txn.total }];

        const itemRows = items.map((item) => {
          const lotMeta = item.lot_label ? ` • ${item.lot_label}` : "";
          const expMeta = item.lot_expiry ? ` • Exp ${item.lot_expiry}` : "";
          const lineTotal = (item.price || 0) * (item.quantity || 0);
          return `
            <tr>
              <td>${new Date(txn.date).toLocaleString()}</td>
              <td>${item.name}${lotMeta}${expMeta}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">${formatKsh(item.price || 0)}</td>
              <td class="right">${formatKsh(lineTotal)}</td>
            </tr>
          `;
        });

        const taxRow = txn.tax && txn.tax > 0
          ? [
              `
              <tr>
                <td>${new Date(txn.date).toLocaleString()}</td>
                <td>${taxLabel}</td>
                <td class="right">-</td>
                <td class="right">-</td>
                <td class="right">${formatKsh(txn.tax)}</td>
              </tr>
            `,
            ]
          : [];

        return [...itemRows, ...taxRow];
      })
      .join("");

    const title = mode === "invoice" ? "Invoice" : "Receipt";
    const vatBase = mode === "invoice" ? totalDue : paidTotal;
    const vatAmount = vatRate > 0 ? vatBase - vatBase / (1 + vatRate / 100) : 0;
    const vatRow = vatRate > 0
      ? `<tr><td>VAT (${vatRate}%) included</td><td class="right">${formatKsh(vatAmount)}</td></tr>`
      : "";
    const refundRow = refundedAmount > 0
      ? `<tr><td>Refunded</td><td class="right">-${formatKsh(refundedAmount)}</td></tr>`
      : "";
    const netPaidRow = refundedAmount > 0
      ? `<tr><td>Net Paid</td><td class="right">${formatKsh(paidTotal)}</td></tr>`
      : "";
    const footerHtml = invoiceFooter ? invoiceFooter.replace(/\n/g, "<br/>") : "";
    const summaryRows = mode === "invoice"
      ? `
        <tr><td>Room Total</td><td class="right">${formatKsh(totalAmount)}</td></tr>
        <tr><td>POS Pending</td><td class="right">${formatKsh(posPendingTotal)}</td></tr>
        <tr><td>Total Due</td><td class="right">${formatKsh(totalDue)}</td></tr>
        ${vatRow}
      `
      : `
        <tr><td>Room Paid</td><td class="right">${formatKsh(paidAmount)}</td></tr>
        <tr><td>POS Paid</td><td class="right">${formatKsh(posCompletedTotal)}</td></tr>
        <tr><td>Total Paid</td><td class="right">${formatKsh(paidTotalRaw)}</td></tr>
        ${refundRow}
        ${netPaidRow}
        ${vatRow}
      `;

    const extraRow = overpayment > 0
      ? `<tr><td>Overpayment</td><td class="right">${formatKsh(overpayment)}</td></tr>`
      : `<tr><td>Balance</td><td class="right">${formatKsh(balanceDue)}</td></tr>`;

    win.document.write(`
      <html>
        <head>
          <title>${title} - ${guest.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 20px; }
            .muted { color: #666; font-size: 12px; }
            .header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { display: flex; gap: 12px; align-items: center; }
            .logo { height: 48px; width: auto; object-fit: contain; }
            .brand-name { font-size: 18px; font-weight: 700; }
            .doc-title { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border-bottom: 1px solid #eee; padding: 8px; font-size: 12px; vertical-align: top; }
            th { text-align: left; background: #fafafa; }
            .right { text-align: right; }
            .section { margin-top: 20px; }
            .footer { margin-top: 24px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              ${propertyLogoUrl ? `<img src="${propertyLogoUrl}" class="logo" />` : ""}
              <div>
                <div class="brand-name">${propertyName}</div>
                ${propertyAddressLine ? `<div class="muted">${propertyAddressLine}</div>` : ""}
                ${propertyContactLine ? `<div class="muted">${propertyContactLine}</div>` : ""}
                ${taxPin ? `<div class="muted">PIN/VAT: ${taxPin}</div>` : ""}
              </div>
            </div>
            <div class="doc-title">
              <div class="brand-name">${title}</div>
              <div class="muted">Issued ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <div class="muted">Guest: ${guest.name} • Room ${guest.roomNumber}</div>
          <div class="muted">Stay: ${formatDateTime(guest.checkIn)} - ${formatDateTime(guest.checkOut)}</div>

          <div class="section">
            <h2 style="font-size: 14px; margin-bottom: 6px;">Summary</h2>
            <table>
              <tbody>
                ${summaryRows}
                ${extraRow}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 style="font-size: 14px; margin-bottom: 6px;">POS Line Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th class="right">Qty</th>
                  <th class="right">Unit</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${posLines || `<tr><td colspan="5">No POS items</td></tr>`}
              </tbody>
            </table>
          </div>

          ${footerHtml ? `<div class="footer">${footerHtml}</div>` : ""}

          <script>
            (function() {
              const triggerPrint = () => {
                window.focus();
                window.print();
              };
              const logo = document.querySelector(".logo");
              if (logo && !logo.complete) {
                logo.addEventListener("load", () => setTimeout(triggerPrint, 150));
                logo.addEventListener("error", () => setTimeout(triggerPrint, 150));
              } else {
                setTimeout(triggerPrint, 150);
              }
            })();
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setIsSending(true);
    // Simulate sending message
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Message sent to ${guest.name}`);
    setMessage("");
    setShowMessage(false);
    setIsSending(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{guest.name}</h3>
                <p className="text-sm text-muted-foreground">Room {guest.roomNumber} • {guest.roomType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={status.className}>{status.label}</Badge>
              {paymentStatusCombined === "Overpaid" && (
                <Badge className={paymentColorCombined}>Overpaid</Badge>
              )}
              {guest.lastAssessment && (
                <Badge className={assessmentBadge}>
                  {hasAssessmentFlags ? "Assessment Issues" : "Assessment OK"}
                </Badge>
              )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {guest.status === "pre-arrival" && (
                    <DropdownMenuItem onClick={() => onCheckIn?.(guest.id)}>
                      Check In Guest
                    </DropdownMenuItem>
                  )}
                  {guest.status === "checked-in" && (
                    <DropdownMenuItem onClick={() => setShowCheckout(true)}>
                      Check Out Guest
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setShowDetails(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/guests/${guest.id}`)}>
                    <UserCircle className="h-4 w-4 mr-2" />
                    Open Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowMessage(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBilling(true)}>
                    <Receipt className="h-4 w-4 mr-2" />
                    View Billing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{guest.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{guest.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(guest.checkIn)} → {formatDateTime(guest.checkOut)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{guestCount} Guest{guestCount > 1 ? "s" : ""}</span>
            </div>
          </div>

          {guest.specialRequests && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mb-3">
              📝 {guest.specialRequests}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {formatKsh(paidAmount)} / {formatKsh(totalAmount)}
              </span>
            </div>
            <Badge className={paymentColor}>{paymentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guest Details</DialogTitle>
            <DialogDescription>Complete information for {guest.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{guest.name}</h3>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">Room {guest.roomNumber} ({guest.roomType})</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Email</span>
                <span>{guest.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Phone</span>
                <span>{guest.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">ID Number</span>
                <span>{guest.idNumber || "—"}</span>
              </div>
              {guest.idPhotoUrl && (
                <div className="py-2 border-b">
                  <span className="text-muted-foreground block mb-1">ID Photo</span>
                  <div className="flex items-center gap-3">
                    <img
                      src={guest.idPhotoUrl}
                      alt={`ID for ${guest.name}`}
                      className="h-20 w-32 rounded-md border object-cover"
                    />
                    <a
                      href={guest.idPhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary"
                    >
                      View full size
                    </a>
                  </div>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Check-in</span>
                <span>{formatDateTime(guest.checkIn)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Check-out</span>
                <span>{formatDateTime(guest.checkOut)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Guests</span>
                <span>{guestCount}</span>
              </div>
              {guest.specialRequests && (
                <div className="py-2">
                  <span className="text-muted-foreground block mb-1">Special Requests</span>
                  <p className="bg-muted/50 rounded p-2 text-sm">{guest.specialRequests}</p>
                </div>
              )}
              {guest.lastAssessment && (
                <div className="py-2">
                  <span className="text-muted-foreground block mb-1">Latest Room Assessment</span>
                  <div className="bg-muted/50 rounded p-2 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Condition</span>
                      <span className="capitalize">{guest.lastAssessment.overallCondition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Damages</span>
                      <span>{guest.lastAssessment.damagesFound ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missing Items</span>
                      <span>{guest.lastAssessment.missingItemsCount}</span>
                    </div>
                    {(guest.lastAssessment.damageCost > 0 || guest.lastAssessment.missingCost > 0) && (
                      <div className="flex justify-between text-destructive">
                        <span>Cost</span>
                        <span>{formatKsh(guest.lastAssessment.damageCost + guest.lastAssessment.missingCost)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Type Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout Type</DialogTitle>
            <DialogDescription>
              Select how you want to checkout {guest.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={() => {
                onCheckOut?.(guest.id);
                setShowCheckout(false);
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Standard Checkout
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setShowCheckout(false);
                if (guest.bookingId) {
                  setShowRefund(true);
                }
              }}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Early Checkout + Refund Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessage} onOpenChange={setShowMessage}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message to Guest</DialogTitle>
            <DialogDescription>Send a message to {guest.name} ({guest.phone})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMessage(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Billing Dialog */}
      <Dialog open={showBilling} onOpenChange={setShowBilling}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Billing Details</DialogTitle>
            <DialogDescription>Payment information for {guest.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Room {guest.roomNumber}</span>
                <Badge className={status.className}>{status.label}</Badge>
              </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Room Type</span>
                <span className="capitalize">{guest.roomType}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Stay Period</span>
                <span>{formatDateTime(guest.checkIn)} - {formatDateTime(guest.checkOut)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Room Total</span>
                <span className="font-medium">{formatKsh(totalAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">POS Pending</span>
                <span className="font-medium">{formatKsh(posPendingTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Damages / Missing</span>
                <span className="font-medium">{formatKsh(assessmentCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Due (Room + POS)</span>
                <span className="font-medium">{formatKsh(totalDue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Paid Amount (Net)</span>
                <span className="font-medium text-status-available">{formatKsh(paidTotal)}</span>
              </div>
              {refundedAmount > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Refunded to Guest</span>
                  <span className="font-medium text-destructive">-{formatKsh(refundedAmount)}</span>
                </div>
              )}
              {overpayment > 0 ? (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Overpayment</span>
                  <span className="font-semibold text-blue-600">{formatKsh(overpayment)}</span>
                </div>
              ) : (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={`font-semibold ${balanceDue > 0 ? 'text-status-maintenance' : 'text-status-available'}`}>
                    {formatKsh(balanceDue)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="font-medium">Payment Status</span>
            <Badge className={paymentColorCombined}>{paymentStatusCombined}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handlePrint("invoice")}>
              Print Invoice
            </Button>
            <Button variant="outline" onClick={() => handlePrint("receipt")}>
              Print Receipt
            </Button>
            {overpayment > 0 && guest.bookingId && (
              <Button variant="outline" onClick={() => setShowOverpayRefund(true)}>
                Request Overpayment Refund
              </Button>
            )}
          </div>

            {guest.posTransactions && guest.posTransactions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">POS Purchases</span>
                  <span className="text-sm font-semibold">{formatKsh(posPendingTotal + posCompletedTotal)}</span>
                </div>
                <div className="space-y-2">
                  {guest.posTransactions.map((txn) => (
                    <div key={txn.id} className="rounded-md border bg-muted/50 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatKsh(txn.total)}</span>
                        <span className="capitalize">{txn.paymentMethod}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(txn.date).toLocaleString()} • {txn.itemsSummary || "Items"} • {txn.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`payment-${guest.id}`}>Record Payment</Label>
              <div className="flex gap-2">
                <Input
                  id={`payment-${guest.id}`}
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                />
                <Button
                  onClick={() => {
                    if (paymentAmount <= 0) return;
                    onRecordPayment?.(guest.id, paymentAmount, paymentMethod);
                    setPaymentAmount(0);
                  }}
                >
                  Apply
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "mpesa", label: "M-Pesa" },
                    { value: "withdraw", label: "Withdraw" },
                    { value: "card", label: "Card" },
                    { value: "bank-transfer", label: "Bank Transfer" },
                  ].map((method) => (
                    <Button
                      key={method.value}
                      type="button"
                      variant={paymentMethod === method.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod(method.value as typeof paymentMethod)}
                    >
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Add a payment received from the guest.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {guest.bookingId && (
        <RefundRequestModal
          open={showRefund}
          onOpenChange={setShowRefund}
          bookingId={guest.bookingId}
          guestId={guest.id}
          guestName={guest.name}
          roomNumber={guest.roomNumber}
          amountPaid={paidAmount}
          onComplete={() => onCheckOut?.(guest.id)}
        />
      )}

      {guest.bookingId && overpayment > 0 && (
        <RefundRequestModal
          open={showOverpayRefund}
          onOpenChange={setShowOverpayRefund}
          bookingId={guest.bookingId}
          guestId={guest.id}
          guestName={guest.name}
          roomNumber={guest.roomNumber}
          amountPaid={overpayment}
        />
      )}
    </>
  );
};
