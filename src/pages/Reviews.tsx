import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Phone,
  MessageSquare,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_id: string | null;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean | null;
  created_at: string;
}

const Reviews = () => {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["all_reviews"],
    queryFn: async () => {
      // Use RPC or direct query to get all reviews (bypass RLS that only shows approved)
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const handleApprove = async (id: string) => {
    try {
      await updateReview.mutateAsync({ id, is_approved: true });
      toast.success("Review approved and now visible on landing page");
    } catch (error) {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateReview.mutateAsync({ id, is_approved: false });
      toast.success("Review rejected");
    } catch (error) {
      toast.error("Failed to reject review");
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (statusFilter === "pending") return review.is_approved === null || review.is_approved === false;
    if (statusFilter === "approved") return review.is_approved === true;
    return true;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.is_approved === null || r.is_approved === false).length,
    approved: reviews.filter(r => r.is_approved === true).length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0",
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews Management</h1>
          <p className="text-muted-foreground">
            Approve or reject guest feedback before it appears on the landing page
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No reviews found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReviews.map((review) => (
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
                    </div>
                    <Badge className={
                      review.is_approved === true
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }>
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

                  {/* Date */}
                  <div className="text-xs text-muted-foreground">
                    Submitted: {format(new Date(review.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>

                  {/* Actions */}
                  {review.is_approved !== true && (
                    <div className="flex gap-2 pt-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Reviews;
