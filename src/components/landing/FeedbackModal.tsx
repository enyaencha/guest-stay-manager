import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Star, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeedbackModal = ({ open, onOpenChange }: FeedbackModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    rating: 0,
    comment: "",
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || formData.rating === 0 || !formData.comment) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Find guest by phone to link review
      const { data: guest } = await supabase
        .from("guests")
        .select("id")
        .eq("phone", formData.phone)
        .maybeSingle();

      // Find their booking if exists
      let bookingId = null;
      if (guest) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("id")
          .eq("guest_id", guest.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        bookingId = booking?.id || null;
      }

      // Save review to database
      const { error } = await supabase.from("reviews").insert({
        guest_id: guest?.id || null,
        booking_id: bookingId,
        guest_name: formData.name,
        guest_phone: formData.phone,
        rating: formData.rating,
        comment: formData.comment,
        is_approved: false, // Needs staff approval
      });

      if (error) throw error;
      
      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch (error: any) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", phone: "", rating: 0, comment: "" });
    setIsSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Experience</DialogTitle>
        </DialogHeader>

        {!isSubmitted ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0712 345 678"
              />
              <p className="text-xs text-muted-foreground">
                Used to verify your stay with us
              </p>
            </div>

            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= formData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
              {formData.rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.rating === 5 && "Excellent!"}
                  {formData.rating === 4 && "Very Good!"}
                  {formData.rating === 3 && "Good"}
                  {formData.rating === 2 && "Fair"}
                  {formData.rating === 1 && "Poor"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Your Review *</Label>
              <Textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Tell us about your stay..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.name || !formData.phone || formData.rating === 0 || !formData.comment}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
              <p className="text-muted-foreground text-sm">
                Your feedback helps us improve and serve you better.
              </p>
            </div>
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
