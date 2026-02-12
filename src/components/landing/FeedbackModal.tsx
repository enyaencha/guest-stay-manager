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
    cleanliness: 0,
    staff: 0,
    comfort: 0,
    value: 0,
    comment: "",
  });

  const renderRatingInput = (value: number, onChange: (value: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    const hasRating =
      formData.rating > 0 ||
      formData.cleanliness > 0 ||
      formData.staff > 0 ||
      formData.comfort > 0 ||
      formData.value > 0;
    if (!formData.name || !formData.phone || !hasRating || !formData.comment) {
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
      let roomNumber: string | null = null;
      if (guest) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, room_number")
          .eq("guest_id", guest.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        bookingId = booking?.id || null;
        roomNumber = booking?.room_number || null;
      }

      const categoryRatings = [
        formData.cleanliness,
        formData.staff,
        formData.comfort,
        formData.value,
      ].filter((rating) => rating > 0);

      const computedOverall =
        formData.rating > 0
          ? formData.rating
          : categoryRatings.length > 0
            ? Math.round(categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length)
            : 0;

      // Save review to database
      const { error } = await supabase.from("reviews").insert({
        guest_id: guest?.id || null,
        booking_id: bookingId,
        room_number: roomNumber,
        guest_name: formData.name,
        guest_phone: formData.phone,
        rating: computedOverall,
        cleanliness_rating: formData.cleanliness || null,
        staff_rating: formData.staff || null,
        comfort_rating: formData.comfort || null,
        value_rating: formData.value || null,
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
    setFormData({
      name: "",
      phone: "",
      rating: 0,
      cleanliness: 0,
      staff: 0,
      comfort: 0,
      value: 0,
      comment: "",
    });
    setIsSubmitted(false);
    onOpenChange(false);
  };

  const hasRating =
    formData.rating > 0 ||
    formData.cleanliness > 0 ||
    formData.staff > 0 ||
    formData.comfort > 0 ||
    formData.value > 0;
  const isSubmitDisabled =
    isSubmitting || !formData.name || !formData.phone || !hasRating || !formData.comment;

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
              {renderRatingInput(formData.rating, (rating) => setFormData({ ...formData, rating }))}
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

            <div className="space-y-3">
              <Label>Category Ratings (Optional)</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Cleanliness</span>
                  {renderRatingInput(formData.cleanliness, (rating) =>
                    setFormData({ ...formData, cleanliness: rating })
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Staff</span>
                  {renderRatingInput(formData.staff, (rating) =>
                    setFormData({ ...formData, staff: rating })
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Comfort</span>
                  {renderRatingInput(formData.comfort, (rating) =>
                    setFormData({ ...formData, comfort: rating })
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Value for Money</span>
                  {renderRatingInput(formData.value, (rating) =>
                    setFormData({ ...formData, value: rating })
                  )}
                </div>
              </div>
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
              disabled={isSubmitDisabled}
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
