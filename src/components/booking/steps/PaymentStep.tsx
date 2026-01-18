import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookingFormData } from "@/types/booking";
import { formatKsh } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Building2,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface PaymentStepProps {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
  onComplete: () => void;
}

const paymentMethods = [
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, description: 'Pay via M-Pesa mobile money' },
  { id: 'cash', label: 'Cash', icon: Banknote, description: 'Pay in cash at reception' },
  { id: 'card', label: 'Card', icon: CreditCard, description: 'Credit or debit card' },
  { id: 'bank-transfer', label: 'Bank Transfer', icon: Building2, description: 'Direct bank transfer' },
];

export function PaymentStep({ formData, updateFormData, onComplete }: PaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const minimumDeposit = Math.ceil(formData.totalAmount * 0.3);

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onComplete();
  };

  const depositOptions = [
    { value: minimumDeposit, label: '30% Deposit' },
    { value: Math.ceil(formData.totalAmount * 0.5), label: '50% Deposit' },
    { value: formData.totalAmount, label: 'Full Payment' },
  ];

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
        <h3 className="font-medium">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Room</span>
            <span>{formData.roomNumber} - {formData.roomType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Guest</span>
            <span>{formData.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check-in</span>
            <span>{format(formData.checkIn, 'PPP')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check-out</span>
            <span>{format(formData.checkOut, 'PPP')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span>{formData.nights} night{formData.nights > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate per night</span>
            <span>{formatKsh(formData.basePrice)}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span>Total Amount</span>
            <span className="text-primary">{formatKsh(formData.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-3">
        <Label>Payment Method</Label>
        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(value) => updateFormData({ paymentMethod: value as BookingFormData['paymentMethod'] })}
          className="grid grid-cols-2 gap-3"
        >
          {paymentMethods.map((method) => (
            <Label
              key={method.id}
              htmlFor={method.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                formData.paymentMethod === method.id && "border-primary bg-primary/5"
              )}
            >
              <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
              <method.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{method.label}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Deposit Amount */}
      <div className="space-y-3">
        <Label>Deposit Amount</Label>
        <div className="grid grid-cols-3 gap-2">
          {depositOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={formData.depositAmount === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => updateFormData({ 
                depositAmount: option.value,
                paymentStatus: option.value === formData.totalAmount ? 'paid' : 'partial'
              })}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Custom amount:</span>
          <Input
            type="number"
            className="w-32"
            placeholder="Amount"
            value={formData.depositAmount || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              updateFormData({ 
                depositAmount: value,
                paymentStatus: value >= formData.totalAmount ? 'paid' : value > 0 ? 'partial' : 'pending'
              });
            }}
          />
          <span className="text-sm text-muted-foreground">KSH</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum deposit: {formatKsh(minimumDeposit)} (30%)
        </p>
      </div>

      {/* Payment Summary */}
      {formData.depositAmount > 0 && (
        <div className="p-4 rounded-lg border border-status-available/30 bg-status-available-bg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Deposit to pay now</span>
            <span className="font-semibold">{formatKsh(formData.depositAmount)}</span>
          </div>
          {formData.depositAmount < formData.totalAmount && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Balance due at check-in</span>
              <span>{formatKsh(formData.totalAmount - formData.depositAmount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Process Payment Button */}
      <Button 
        className="w-full" 
        size="lg"
        onClick={handleProcessPayment}
        disabled={formData.depositAmount < minimumDeposit || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Booking & Pay {formatKsh(formData.depositAmount)}
          </>
        )}
      </Button>
    </div>
  );
}
