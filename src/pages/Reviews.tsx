import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useTabQueryParam } from "@/hooks/useTabQueryParam";
import { useBookings, useGuests } from "@/hooks/useGuests";
import { useNavigate } from "react-router-dom";
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  MessageSquare,
  Loader2,
  Plus,
  ClipboardList,
  Wrench,
  Sparkles,
  Reply,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_id: string | null;
  booking_id: string | null;
  room_number: string | null;
  rating: number;
  cleanliness_rating: number | null;
  staff_rating: number | null;
  comfort_rating: number | null;
  value_rating: number | null;
  comment: string | null;
  response: string | null;
  responded_at: string | null;
  internal_notes: string | null;
  maintenance_issue_id: string | null;
  housekeeping_task_id: string | null;
  is_approved: boolean | null;
  created_at: string;
}

interface ReviewRequest {
  id: string;
  booking_id: string | null;
  guest_id: string | null;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  channel: "email" | "sms" | "manual";
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

const ratingOptions = [1, 2, 3, 4, 5];

const Reviews = () => {
  const [statusFilter, setStatusFilter] = useTabQueryParam({
    key: "status",
    defaultValue: "pending",
    allowed: ["all", "pending", "approved", "rejected"],
  });
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState("");
  const [internalNotesDraft, setInternalNotesDraft] = useState("");
  const [creatingReview, setCreatingReview] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [creatingMaintenance, setCreatingMaintenance] = useState(false);
  const [creatingHousekeeping, setCreatingHousekeeping] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
  });
  const [housekeepingForm, setHousekeepingForm] = useState({
    taskType: "inspection",
    priority: "normal",
    notes: "",
  });
  const [newReview, setNewReview] = useState({
    bookingId: "",
    guestId: "",
    guestName: "",
    guestPhone: "",
    roomNumber: "",
    rating: 0,
    cleanliness: 0,
    staff: 0,
    comfort: 0,
    value: 0,
    comment: "",
    publish: true,
    internalNotes: "",
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: bookings = [] } = useBookings();
  const { data: guests = [] } = useGuests();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["all_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });

  const { data: reviewRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["review_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ReviewRequest[];
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Review> }) => {
      const { error } = await supabase
        .from("reviews")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const bookingById = useMemo(() => {
    return new Map(bookings.map((booking) => [booking.id, booking]));
  }, [bookings]);

  const guestById = useMemo(() => {
    return new Map(guests.map((guest) => [guest.id, guest]));
  }, [guests]);

  const selectedReview = selectedReviewId
    ? reviews.find((review) => review.id === selectedReviewId) || null
    : null;

  useEffect(() => {
    if (!selectedReview) return;
    setResponseDraft(selectedReview.response || "");
    setInternalNotesDraft(selectedReview.internal_notes || "");
    setMaintenanceForm({
      title: selectedReview.comment
        ? `Guest feedback: ${selectedReview.comment.slice(0, 40)}...`
        : `Guest feedback follow-up`,
      description: selectedReview.comment || "",
      category: "other",
      priority: "medium",
    });
    setHousekeepingForm({
      taskType: "inspection",
      priority: "normal",
      notes: selectedReview.comment || "",
    });
  }, [selectedReview?.id]);

  const filteredReviews = reviews.filter((review) => {
    if (statusFilter === "pending") return review.is_approved === null || review.is_approved === false;
    if (statusFilter === "approved") return review.is_approved === true;
    return true;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.is_approved === null || r.is_approved === false).length,
    approved: reviews.filter((r) => r.is_approved === true).length,
    avgRating:
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0",
  };

  const requestStats = {
    total: reviewRequests.length,
    pending: reviewRequests.filter((r) => r.status === "pending").length,
    sent: reviewRequests.filter((r) => r.status === "sent").length,
  };

  const getRoomNumber = (review: Review) => {
    if (review.room_number) return review.room_number;
    if (!review.booking_id) return null;
    return bookingById.get(review.booking_id)?.room_number || null;
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {ratingOptions.map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );

  const renderRatingInput = (value: number, onChange: (value: number) => void) => (
    <div className="flex items-center gap-1">
      {ratingOptions.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="rounded p-1 hover:scale-110 transition-transform"
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );

  const handleApprove = async (id: string) => {
    try {
      await updateReview.mutateAsync({ id, updates: { is_approved: true } });
      toast.success("Review approved and now visible on landing page");
    } catch (error) {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateReview.mutateAsync({ id, updates: { is_approved: false } });
      toast.success("Review rejected");
    } catch (error) {
      toast.error("Failed to reject review");
    }
  };

  const resetNewReview = () => {
    setNewReview({
      bookingId: "",
      guestId: "",
      guestName: "",
      guestPhone: "",
      roomNumber: "",
      rating: 0,
      cleanliness: 0,
      staff: 0,
      comfort: 0,
      value: 0,
      comment: "",
      publish: true,
      internalNotes: "",
    });
  };

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookingById.get(bookingId);
    const guest = booking?.guest_id ? guestById.get(booking.guest_id) : null;

    setNewReview((prev) => ({
      ...prev,
      bookingId,
      roomNumber: booking?.room_number || prev.roomNumber,
      guestId: guest?.id || prev.guestId,
      guestName: guest?.name || prev.guestName,
      guestPhone: guest?.phone || prev.guestPhone,
    }));
  };

  const handleCreateReview = async () => {
    if (!newReview.guestName.trim() || !newReview.guestPhone.trim()) {
      toast.error("Guest name and phone are required");
      return;
    }

    const categoryRatings = [
      newReview.cleanliness,
      newReview.staff,
      newReview.comfort,
      newReview.value,
    ].filter((rating) => rating > 0);

    const computedOverall =
      newReview.rating > 0
        ? newReview.rating
        : categoryRatings.length > 0
          ? Math.round(categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length)
          : 0;

    if (computedOverall === 0) {
      toast.error("Please provide an overall rating or category ratings");
      return;
    }

    setCreatingReview(true);

    try {
      const { error } = await supabase
        .from("reviews")
        .insert({
          guest_id: newReview.guestId || null,
          booking_id: newReview.bookingId || null,
          room_number: newReview.roomNumber || null,
          guest_name: newReview.guestName,
          guest_phone: newReview.guestPhone,
          rating: computedOverall,
          cleanliness_rating: newReview.cleanliness || null,
          staff_rating: newReview.staff || null,
          comfort_rating: newReview.comfort || null,
          value_rating: newReview.value || null,
          comment: newReview.comment || null,
          internal_notes: newReview.internalNotes || null,
          is_approved: newReview.publish,
        });

      if (error) throw error;

      toast.success("Review saved successfully");
      queryClient.invalidateQueries({ queryKey: ["all_reviews"] });
      setAddReviewOpen(false);
      resetNewReview();
    } catch (error: any) {
      console.error("Review creation error:", error);
      toast.error(error.message || "Failed to create review");
    } finally {
      setCreatingReview(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedReview) return;
    setSavingDetails(true);
    try {
      await updateReview.mutateAsync({
        id: selectedReview.id,
        updates: {
          response: responseDraft.trim() || null,
          responded_at: responseDraft.trim() ? new Date().toISOString() : null,
          internal_notes: internalNotesDraft.trim() || null,
        },
      });
      toast.success("Review updated");
    } catch (error: any) {
      console.error("Review update error:", error);
      toast.error(error.message || "Failed to update review");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleCreateMaintenance = async () => {
    if (!selectedReview) return;
    const roomNumber = getRoomNumber(selectedReview);
    if (!roomNumber) {
      toast.error("Room number is required to create a maintenance issue");
      return;
    }

    setCreatingMaintenance(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_issues")
        .insert({
          room_number: roomNumber,
          title: maintenanceForm.title || "Guest feedback follow-up",
          description: maintenanceForm.description || null,
          category: maintenanceForm.category,
          priority: maintenanceForm.priority,
        })
        .select()
        .single();

      if (error) throw error;

      await updateReview.mutateAsync({
        id: selectedReview.id,
        updates: { maintenance_issue_id: data.id },
      });

      toast.success("Maintenance issue created");
    } catch (error: any) {
      console.error("Maintenance creation error:", error);
      toast.error(error.message || "Failed to create maintenance issue");
    } finally {
      setCreatingMaintenance(false);
    }
  };

  const handleCreateHousekeeping = async () => {
    if (!selectedReview) return;
    const roomNumber = getRoomNumber(selectedReview);
    if (!roomNumber) {
      toast.error("Room number is required to create a housekeeping task");
      return;
    }

    setCreatingHousekeeping(true);
    try {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .insert({
          room_number: roomNumber,
          task_type: housekeepingForm.taskType,
          priority: housekeepingForm.priority,
          status: "pending",
          notes: housekeepingForm.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      await updateReview.mutateAsync({
        id: selectedReview.id,
        updates: { housekeeping_task_id: data.id },
      });

      toast.success("Housekeeping task created");
    } catch (error: any) {
      console.error("Housekeeping creation error:", error);
      toast.error(error.message || "Failed to create housekeeping task");
    } finally {
      setCreatingHousekeeping(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reviews Management</h1>
            <p className="text-muted-foreground">
              Capture guest assessments, approve feedback, and follow up with action items
            </p>
          </div>
          <Button onClick={() => setAddReviewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Review
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgRating}</p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{requestStats.sent}</p>
                  <p className="text-sm text-muted-foreground">
                    Review Requests (Pending {requestStats.pending})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Reviews Grid */}
        {isLoading || requestsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No reviews found</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReviews.map((review) => {
              const roomNumber = getRoomNumber(review);
              const bookingLabel = review.booking_id
                ? `${review.booking_id.slice(0, 8)}...`
                : "—";

              return (
                <Card key={review.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {review.guest_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {review.guest_phone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Reservation: {bookingLabel} · Room {roomNumber || "—"}
                        </div>
                      </div>
                      <Badge
                        className={
                          review.is_approved === true
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }
                      >
                        {review.is_approved === true ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium">{review.rating}/5</span>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm italic">"{review.comment}"</p>
                      </div>
                    )}

                    {/* Action links */}
                    {(review.maintenance_issue_id || review.housekeeping_task_id) && (
                      <div className="flex flex-wrap gap-2">
                        {review.maintenance_issue_id && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" /> Maintenance linked
                          </Badge>
                        )}
                        {review.housekeeping_task_id && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Housekeeping linked
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <div className="text-xs text-muted-foreground">
                      Submitted: {format(new Date(review.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2">
                      {review.is_approved !== true && (
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleApprove(review.id)}
                            disabled={updateReview.isPending}
                          >
                            {updateReview.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleReject(review.id)}
                            disabled={updateReview.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setSelectedReviewId(review.id)}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        Manage Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Review Dialog */}
      <Dialog open={addReviewOpen} onOpenChange={(open) => {
        setAddReviewOpen(open);
        if (!open) resetNewReview();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Guest Review</DialogTitle>
            <DialogDescription>
              Log guest feedback manually for in-person or paper submissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Reservation (optional)</Label>
                <Select value={newReview.bookingId} onValueChange={handleBookingSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reservation" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.room_number} · {booking.check_in} → {booking.check_out}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input
                  value={newReview.roomNumber}
                  onChange={(event) =>
                    setNewReview((prev) => ({ ...prev, roomNumber: event.target.value }))
                  }
                  placeholder="e.g. 204"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Guest Name</Label>
                <Input
                  value={newReview.guestName}
                  onChange={(event) =>
                    setNewReview((prev) => ({ ...prev, guestName: event.target.value }))
                  }
                  placeholder="Guest name"
                />
              </div>
              <div className="space-y-2">
                <Label>Guest Phone</Label>
                <Input
                  value={newReview.guestPhone}
                  onChange={(event) =>
                    setNewReview((prev) => ({ ...prev, guestPhone: event.target.value }))
                  }
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Overall Rating</Label>
              {renderRatingInput(newReview.rating, (rating) =>
                setNewReview((prev) => ({ ...prev, rating }))
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cleanliness</Label>
                {renderRatingInput(newReview.cleanliness, (rating) =>
                  setNewReview((prev) => ({ ...prev, cleanliness: rating }))
                )}
              </div>
              <div className="space-y-2">
                <Label>Staff</Label>
                {renderRatingInput(newReview.staff, (rating) =>
                  setNewReview((prev) => ({ ...prev, staff: rating }))
                )}
              </div>
              <div className="space-y-2">
                <Label>Comfort</Label>
                {renderRatingInput(newReview.comfort, (rating) =>
                  setNewReview((prev) => ({ ...prev, comfort: rating }))
                )}
              </div>
              <div className="space-y-2">
                <Label>Value for Money</Label>
                {renderRatingInput(newReview.value, (rating) =>
                  setNewReview((prev) => ({ ...prev, value: rating }))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Guest Comment</Label>
              <Textarea
                value={newReview.comment}
                onChange={(event) =>
                  setNewReview((prev) => ({ ...prev, comment: event.target.value }))
                }
                rows={4}
                placeholder="Guest feedback"
              />
            </div>

            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea
                value={newReview.internalNotes}
                onChange={(event) =>
                  setNewReview((prev) => ({ ...prev, internalNotes: event.target.value }))
                }
                rows={3}
                placeholder="Notes for management"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Publish to landing page</Label>
                <p className="text-xs text-muted-foreground">Approved reviews appear publicly.</p>
              </div>
              <Switch
                checked={newReview.publish}
                onCheckedChange={(checked) =>
                  setNewReview((prev) => ({ ...prev, publish: checked }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddReviewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReview} disabled={creatingReview}>
                {creatingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Review"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Review Dialog */}
      <Dialog
        open={Boolean(selectedReviewId)}
        onOpenChange={(open) => {
          if (!open) setSelectedReviewId(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
                <DialogDescription>
                  Respond, add internal notes, and create action items for this review.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedReview.guest_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedReview.guest_phone}</div>
                      <div className="text-sm text-muted-foreground">
                        Reservation: {selectedReview.booking_id || "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Room: {getRoomNumber(selectedReview) || "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {renderStars(selectedReview.rating)}
                        <span className="font-medium">{selectedReview.rating}/5 overall</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Cleanliness: {selectedReview.cleanliness_rating ?? "—"}</span>
                        <span>Staff: {selectedReview.staff_rating ?? "—"}</span>
                        <span>Comfort: {selectedReview.comfort_rating ?? "—"}</span>
                        <span>Value: {selectedReview.value_rating ?? "—"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(selectedReview.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedReview.comment && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Guest Comment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic">"{selectedReview.comment}"</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Reply className="h-4 w-4" />
                      Response to Guest
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={responseDraft}
                      onChange={(event) => setResponseDraft(event.target.value)}
                      rows={3}
                      placeholder="Write a response to the guest"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {selectedReview.responded_at
                        ? `Last responded ${format(new Date(selectedReview.responded_at), "MMM d, yyyy")}`
                        : "No response sent yet"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Internal Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={internalNotesDraft}
                      onChange={(event) => setInternalNotesDraft(event.target.value)}
                      rows={3}
                      placeholder="Notes for management"
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedReviewId(null)}>
                    Close
                  </Button>
                  <Button onClick={handleSaveDetails} disabled={savingDetails}>
                    {savingDetails ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Notes"
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Maintenance Action
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        value={maintenanceForm.title}
                        onChange={(event) =>
                          setMaintenanceForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                        placeholder="Issue title"
                      />
                      <Textarea
                        value={maintenanceForm.description}
                        onChange={(event) =>
                          setMaintenanceForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={3}
                        placeholder="Describe the maintenance issue"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label>Category</Label>
                          <Select
                            value={maintenanceForm.category}
                            onValueChange={(value) =>
                              setMaintenanceForm((prev) => ({ ...prev, category: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hvac">HVAC</SelectItem>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="appliance">Appliance</SelectItem>
                              <SelectItem value="structural">Structural</SelectItem>
                              <SelectItem value="furniture">Furniture</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Priority</Label>
                          <Select
                            value={maintenanceForm.priority}
                            onValueChange={(value) =>
                              setMaintenanceForm((prev) => ({ ...prev, priority: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleCreateMaintenance}
                          disabled={creatingMaintenance}
                          className="flex-1"
                        >
                          {creatingMaintenance ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Create Maintenance Task"
                          )}
                        </Button>
                        {selectedReview.maintenance_issue_id && (
                          <Button
                            variant="outline"
                            onClick={() => navigate("/maintenance")}
                          >
                            View Maintenance
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Housekeeping Action
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={housekeepingForm.notes}
                        onChange={(event) =>
                          setHousekeepingForm((prev) => ({ ...prev, notes: event.target.value }))
                        }
                        rows={3}
                        placeholder="Housekeeping notes"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label>Task Type</Label>
                          <Select
                            value={housekeepingForm.taskType}
                            onValueChange={(value) =>
                              setHousekeepingForm((prev) => ({ ...prev, taskType: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Task type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily-clean">Daily Clean</SelectItem>
                              <SelectItem value="checkout-clean">Checkout Clean</SelectItem>
                              <SelectItem value="deep-clean">Deep Clean</SelectItem>
                              <SelectItem value="turndown">Turndown</SelectItem>
                              <SelectItem value="inspection">Inspection</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Priority</Label>
                          <Select
                            value={housekeepingForm.priority}
                            onValueChange={(value) =>
                              setHousekeepingForm((prev) => ({ ...prev, priority: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleCreateHousekeeping}
                          disabled={creatingHousekeeping}
                          className="flex-1"
                        >
                          {creatingHousekeeping ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Create Housekeeping Task"
                          )}
                        </Button>
                        {selectedReview.housekeeping_task_id && (
                          <Button
                            variant="outline"
                            onClick={() => navigate("/housekeeping")}
                          >
                            View Housekeeping
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Reviews;
