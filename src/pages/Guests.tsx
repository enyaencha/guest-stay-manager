import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GuestCard } from "@/components/guests/GuestCard";
import { ConfirmedBookingCard } from "@/components/guests/ConfirmedBookingCard";
import { RoomAssignmentModal } from "@/components/guests/RoomAssignmentModal";
import { RequestCard } from "@/components/guests/RequestCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGuests, useBookings, useUpdateBooking } from "@/hooks/useGuests";
import { useNotificationSettings } from "@/hooks/useSettings";
import { usePOSTransactions, useUpdatePOSTransaction } from "@/hooks/usePOS";
import { useTabQueryParam } from "@/hooks/useTabQueryParam";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest, GuestRequest } from "@/types/guest";
import { formatKsh } from "@/lib/formatters";
import { 
  Users, 
  UserCheck, 
  Clock, 
  Plus, 
  Search,
  Bell,
  Loader2,
  CalendarCheck
} from "lucide-react";
import { toast } from "sonner";

interface ConfirmedBooking {
  id: string;
  booking_ids: string[];
  guest_id: string | null;
  bill_to_guest_id: string | null;
  guest_name: string;
  guest_phone: string;
  room_type: string;
  room_number: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  pending_rooms: number;
  total_amount: number;
  special_requests: string | null;
}

const Guests = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useTabQueryParam({
    key: "tab",
    defaultValue: "guests",
    allowed: ["guests", "requests", "history", "billing-accounts"],
  });
  const [statusFilter, setStatusFilter] = useTabQueryParam({
    key: "status",
    defaultValue: "all",
    allowed: ["all", "checked-in", "pre-arrival", "checked-out"],
  });
  const [billingSort, setBillingSort] = useTabQueryParam({
    key: "billing_sort",
    defaultValue: "balance-desc",
    allowed: ["balance-desc", "due-desc", "owner-asc", "owner-desc", "status"],
  });
  const [roomAssignmentOpen, setRoomAssignmentOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ConfirmedBooking | null>(null);

  const { data: guests = [], isLoading: guestsLoading } = useGuests();
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const { data: notificationSettings } = useNotificationSettings();
  const updateBooking = useUpdateBooking();
  const updatePOSTransaction = useUpdatePOSTransaction();
  const queryClient = useQueryClient();

  // Fetch guest issues for requests
  const { data: guestIssues = [] } = useQuery({
    queryKey: ["guest_issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_issues")
        .select("*, guests(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roomAssessments = [] } = useQuery({
    queryKey: ["room_assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_assessments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: processedRefunds = [], isLoading: refundsLoading } = useQuery({
    queryKey: ["refund_requests_processed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("booking_id, refund_amount, status")
        .eq("status", "processed");
      if (error) {
        console.warn("Refund lookup failed:", error.message);
        return [];
      }
      return data || [];
    },
  });

  const updateIssue = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const { error } = await supabase
        .from("guest_issues")
        .update({ resolved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_issues"] });
      toast.success("Request updated");
    },
  });

  // Get confirmed/reserved bookings awaiting room assignment.
  // Group duplicate lead requests so multi-room reservations don't appear as repeated cards.
  const confirmedBookingGroups = new Map<string, ConfirmedBooking>();
  bookings
    .filter((b) => ["confirmed", "reserved"].includes(b.status))
    .forEach((b) => {
      const billingGuestId = b.bill_to_guest_id || b.guest_id;
      const guest = guests.find((g) => g.id === billingGuestId);
      const groupKey = [
        billingGuestId || guest?.phone || "",
        String(b.room_type || "").trim().toLowerCase(),
        b.check_in,
        b.check_out,
        String(b.special_requests || "").trim().toLowerCase(),
      ].join("|");

      const existing = confirmedBookingGroups.get(groupKey);
      if (existing) {
        existing.pending_rooms += 1;
        existing.booking_ids.push(b.id);
        existing.total_amount = Number(existing.total_amount || 0) + Number(b.total_amount || 0);
        existing.guests_count = Math.max(existing.guests_count, Number(b.guests_count) || 1);
        if ((!existing.room_number || existing.room_number === "TBA") && b.room_number && b.room_number !== "TBA") {
          existing.room_number = b.room_number;
        }
        return;
      }

      confirmedBookingGroups.set(groupKey, {
        id: b.id,
        booking_ids: [b.id],
        guest_id: b.guest_id,
        bill_to_guest_id: billingGuestId,
        guest_name: guest?.name || "Unknown",
        guest_phone: guest?.phone || "",
        room_type: b.room_type,
        room_number: b.room_number,
        check_in: b.check_in,
        check_out: b.check_out,
        guests_count: Number(b.guests_count) || 1,
        pending_rooms: 1,
        total_amount: Number(b.total_amount) || 0,
        special_requests: b.special_requests,
      });
    });

  const confirmedBookings: ConfirmedBooking[] = Array.from(confirmedBookingGroups.values());

  // Combine guests with their most relevant booking (prefer checked-in, then pre-arrival, then checkout history).
  const guestsWithBookings = guests
    .map((guest) => {
      const guestBookings = bookings.filter(
        (b) => b.guest_id === guest.id && !["reserved", "confirmed"].includes(b.status)
      );

      if (guestBookings.length === 0) {
        return {
          ...guest,
          booking: undefined,
        };
      }

      const bookingPriority: Record<string, number> = {
        "checked-in": 0,
        "pre-arrival": 1,
        "checked-out": 2,
        "no-show": 3,
        cancelled: 4,
      };

      const booking = [...guestBookings].sort((a, b) => {
        const priorityDiff =
          (bookingPriority[a.status] ?? 99) - (bookingPriority[b.status] ?? 99);
        if (priorityDiff !== 0) return priorityDiff;

        const aUpdated = new Date(a.updated_at || a.check_in || 0).getTime();
        const bUpdated = new Date(b.updated_at || b.check_in || 0).getTime();
        return bUpdated - aUpdated;
      })[0];

      return {
        ...guest,
        booking,
      };
    })
    .filter((g) => g.booking);

  const sendReviewRequest = async (guest: (typeof guestsWithBookings)[number]) => {
    if (!notificationSettings?.review_requests) return;
    if (!guest?.booking) return;

    const { data, error } = await supabase.functions.invoke("send-review-request", {
      body: { bookingId: guest.booking.id },
    });

    if (error) throw error;

    if (data?.status === "sent") {
      toast.success("Feedback request sent");
    } else if (data?.status === "pending") {
      toast.message("Feedback request queued");
    }
  };

  // Convert to Guest type for component
  const refundedByBooking = new Map<string, number>();
  processedRefunds.forEach((refund) => {
    if (!refund.booking_id) return;
    const current = refundedByBooking.get(refund.booking_id) || 0;
    refundedByBooking.set(refund.booking_id, current + Number(refund.refund_amount || 0));
  });

  const latestAssessmentByBooking = new Map<string, { timestamp: number; total: number }>();
  roomAssessments.forEach((assessment) => {
    if (!assessment.booking_id) return;
    const missingItems = Array.isArray(assessment.missing_items) ? assessment.missing_items : [];
    const missingCost = missingItems.reduce(
      (sum: number, item: any) => sum + (Number(item.cost) || 0),
      0
    );
    const totalAssessmentCost = Number(assessment.damage_cost || 0) + Number(missingCost);
    const timestamp = new Date(assessment.created_at || assessment.assessment_date || 0).getTime();
    const existing = latestAssessmentByBooking.get(assessment.booking_id);
    if (!existing || timestamp >= existing.timestamp) {
      latestAssessmentByBooking.set(assessment.booking_id, {
        timestamp,
        total: totalAssessmentCost,
      });
    }
  });

  type BillingAccountSummary = {
    bookingCount: number;
    roomTotal: number;
    roomPaid: number;
    posPending: number;
    posPaid: number;
    assessmentTotal: number;
    refundedTotal: number;
    totalDue: number;
    totalPaid: number;
    balance: number;
    overpayment: number;
  };

  const accountBillingMap = new Map<string, BillingAccountSummary>();
  const emptyBillingSummary = (): BillingAccountSummary => ({
    bookingCount: 0,
    roomTotal: 0,
    roomPaid: 0,
    posPending: 0,
    posPaid: 0,
    assessmentTotal: 0,
    refundedTotal: 0,
    totalDue: 0,
    totalPaid: 0,
    balance: 0,
    overpayment: 0,
  });

  bookings.forEach((booking) => {
    if (["cancelled", "no-show"].includes(booking.status)) return;

    const billingOwnerId = booking.bill_to_guest_id || booking.guest_id;
    if (!billingOwnerId) return;

    const summary = accountBillingMap.get(billingOwnerId) || emptyBillingSummary();
    summary.bookingCount += 1;
    summary.roomTotal += Number(booking.total_amount || 0);
    summary.roomPaid += Number(booking.paid_amount || 0);
    summary.refundedTotal += Number(refundedByBooking.get(booking.id) || 0);
    summary.assessmentTotal += Number(latestAssessmentByBooking.get(booking.id)?.total || 0);
    accountBillingMap.set(billingOwnerId, summary);
  });

  posTransactions.forEach((txn) => {
    if (!txn.guest_id) return;
    const summary = accountBillingMap.get(txn.guest_id) || emptyBillingSummary();
    const total = Number(txn.total || 0);
    if (txn.status === "pending") {
      summary.posPending += total;
    } else if (txn.status === "completed") {
      summary.posPaid += total;
    }
    accountBillingMap.set(txn.guest_id, summary);
  });

  accountBillingMap.forEach((summary) => {
    summary.totalDue = summary.roomTotal + summary.posPending + summary.assessmentTotal;
    summary.totalPaid = Math.max(0, summary.roomPaid + summary.posPaid - summary.refundedTotal);
    summary.balance = Math.max(0, summary.totalDue - summary.totalPaid);
    summary.overpayment = Math.max(0, summary.totalPaid - summary.totalDue);
  });

  type BillingAccountRow = BillingAccountSummary & {
    ownerId: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    status: "Paid" | "Overpaid" | "Partial" | "Unpaid";
  };

  const billingAccountRows: BillingAccountRow[] = Array.from(accountBillingMap.entries())
    .map(([ownerId, summary]) => {
      const owner = guests.find((g) => g.id === ownerId);
      const status: BillingAccountRow["status"] =
        summary.overpayment > 0
          ? "Overpaid"
          : summary.balance <= 0
            ? "Paid"
            : summary.totalPaid > 0
              ? "Partial"
              : "Unpaid";

      return {
        ...summary,
        ownerId,
        ownerName: owner?.name || "Unknown Account",
        ownerPhone: owner?.phone || "—",
        ownerEmail: owner?.email || "—",
        status,
      };
    })
    .filter((row) => row.bookingCount > 0 || row.posPending > 0 || row.posPaid > 0)
    .sort((a, b) => {
      const diff = b.balance - a.balance;
      if (Math.abs(diff) > 0.01) return diff;
      return a.ownerName.localeCompare(b.ownerName);
    });

  const toEpoch = (value?: string | null) => {
    if (!value) return null;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  };

  const POS_STAY_GRACE_MS = 12 * 60 * 60 * 1000;

  const isPosTransactionForGuestStay = (
    transaction: (typeof posTransactions)[number],
    guestId: string,
    booking?: {
      room_number: string;
      check_in: string;
      check_out: string;
      status: string;
    }
  ) => {
    if (transaction.guest_id && transaction.guest_id === guestId) return true;

    if (!booking?.room_number || booking.room_number === "TBA") return false;
    if (transaction.room_number !== booking.room_number) return false;
    if (transaction.guest_id && transaction.guest_id !== guestId) return false;

    const createdAt = toEpoch(transaction.created_at);
    const checkIn = toEpoch(booking.check_in);
    const checkOut = toEpoch(booking.check_out);

    if (createdAt !== null && checkIn !== null && checkOut !== null) {
      const start = Math.min(checkIn, checkOut) - POS_STAY_GRACE_MS;
      const end = Math.max(checkIn, checkOut) + POS_STAY_GRACE_MS;
      return createdAt >= start && createdAt <= end;
    }

    // For legacy rows without guest_id, fallback to room-based matching only on active stays.
    return booking.status !== "checked-out";
  };

  const guestEntries = guestsWithBookings.map((g) => {
    const bookingId = g.booking?.id;
    const bookingAssessment =
      roomAssessments.find((a) => bookingId && a.booking_id === bookingId) ||
      roomAssessments.find((a) => a.guest_id === g.id);

    const guestPosTransactions = posTransactions
      .filter((t) => isPosTransactionForGuestStay(t, g.id, g.booking))
      .map((t) => ({
        id: t.id,
        date: t.created_at,
        total: t.total,
        subtotal: t.subtotal,
        tax: t.tax,
        paymentMethod: t.payment_method,
        status: t.status,
        items: Array.isArray(t.items)
          ? (t.items as { name: string; quantity: number; price: number; lot_label?: string | null; lot_expiry?: string | null }[])
          : [],
        itemsSummary: Array.isArray(t.items)
          ? (t.items as { name: string; quantity: number; price: number }[])
              .map((item) => `${item.quantity}x ${item.name}`)
              .join(", ")
          : "",
      }));

    const missingItems = Array.isArray(bookingAssessment?.missing_items)
      ? bookingAssessment.missing_items
      : [];
    const missingCost = missingItems.reduce(
      (sum: number, item: any) => sum + (Number(item.cost) || 0),
      0
    );

    const billingOwnerId =
      g.booking?.bill_to_guest_id ||
      g.booking?.guest_id ||
      g.id;
    const billingOwner = guests.find((guest) => guest.id === billingOwnerId);
    const billingAccountSummary = accountBillingMap.get(billingOwnerId || "") || emptyBillingSummary();

    const guestRecord: Guest = {
      id: g.id,
      name: g.name,
      email: g.email || '',
      phone: g.phone,
      billingOwnerId: billingOwnerId || null,
      billingOwnerName: billingOwner?.name || g.name,
      idNumber: g.id_number || null,
      idPhotoUrl: g.id_photo_url || null,
      bookingId,
      roomNumber: g.booking?.room_number || '',
      roomType: (g.booking?.room_type || 'single') as Guest['roomType'],
      checkIn: g.booking?.check_in || '',
      checkOut: g.booking?.check_out || '',
      status: (g.booking?.status === 'checked-in' ? 'checked-in' :
               g.booking?.status === 'checked-out' ? 'checked-out' : 'pre-arrival') as Guest['status'],
      totalAmount: g.booking?.total_amount || 0,
      paidAmount: g.booking?.paid_amount || 0,
      refundedAmount: bookingId ? refundedByBooking.get(bookingId) || 0 : 0,
      guests: g.booking?.guests_count || 1,
      specialRequests: g.booking?.special_requests || undefined,
      posTransactions: guestPosTransactions,
      billingAccount: billingAccountSummary,
      lastAssessment: bookingAssessment
        ? {
            overallCondition: bookingAssessment.overall_condition,
            damagesFound: bookingAssessment.damages_found || false,
            missingItemsCount: missingItems.length,
            damageCost: Number(bookingAssessment.damage_cost) || 0,
            missingCost: Number(missingCost),
          }
        : undefined,
    };

    const posPendingTotal = guestPosTransactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + Number(t.total), 0);
    const posCompletedTotal = guestPosTransactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.total), 0);
    const assessmentCost =
      (guestRecord.lastAssessment?.damageCost || 0) +
      (guestRecord.lastAssessment?.missingCost || 0);
    const totalDue = Number(guestRecord.totalAmount || 0) + posPendingTotal + assessmentCost;
    const paidTotal =
      Number(guestRecord.paidAmount || 0) +
      posCompletedTotal -
      Number(guestRecord.refundedAmount || 0);
    const hasAssessmentIssues =
      !!guestRecord.lastAssessment &&
      (guestRecord.lastAssessment.damagesFound || guestRecord.lastAssessment.missingItemsCount > 0);
    const archiveEligible =
      guestRecord.status === "checked-out" &&
      !hasAssessmentIssues &&
      Math.abs(totalDue - paidTotal) < 0.01;

    return {
      guest: guestRecord,
      archiveEligible,
    };
  });

  const activeGuestData = guestEntries
    .filter((entry) => !entry.archiveEligible)
    .map((entry) => entry.guest);
  const historyGuestData = guestEntries
    .filter((entry) => entry.archiveEligible)
    .map((entry) => entry.guest);

  // Convert issues to requests
  const requests: GuestRequest[] = guestIssues.map(issue => ({
    id: issue.id,
    guestId: issue.guest_id,
    guestName: issue.guests?.name || 'Unknown Guest',
    roomNumber: issue.room_number,
    type: issue.issue_type as GuestRequest['type'],
    description: issue.description,
    status: issue.resolved ? 'completed' : 'pending',
    priority: issue.severity as GuestRequest['priority'],
    createdAt: issue.created_at,
  }));

  const stats = {
    totalGuests: activeGuestData.length,
    checkedIn: activeGuestData.filter(g => g.status === "checked-in").length,
    preArrival: activeGuestData.filter(g => g.status === "pre-arrival").length,
    pendingRequests: confirmedBookings.length,
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesRoomSearch = (roomNumber: string, query: string) => {
    if (!query) return true;
    const normalizedRoom = roomNumber.toLowerCase();
    return (
      normalizedRoom.includes(query) ||
      `room ${normalizedRoom}`.includes(query)
    );
  };

  const filteredGuests = activeGuestData.filter(guest => {
    const matchesSearch =
      guest.name.toLowerCase().includes(normalizedSearch) ||
      guest.email.toLowerCase().includes(normalizedSearch) ||
      guest.phone.toLowerCase().includes(normalizedSearch) ||
      matchesRoomSearch(guest.roomNumber, normalizedSearch);
    const matchesStatus = statusFilter === "all" || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const filteredHistoryGuests = historyGuestData.filter((guest) => {
    return (
      guest.name.toLowerCase().includes(normalizedSearch) ||
      guest.email.toLowerCase().includes(normalizedSearch) ||
      guest.phone.toLowerCase().includes(normalizedSearch) ||
      matchesRoomSearch(guest.roomNumber, normalizedSearch)
    );
  });
  const filteredBillingAccounts = billingAccountRows.filter((account) => {
    return (
      account.ownerName.toLowerCase().includes(normalizedSearch) ||
      account.ownerPhone.toLowerCase().includes(normalizedSearch) ||
      account.ownerEmail.toLowerCase().includes(normalizedSearch) ||
      account.status.toLowerCase().includes(normalizedSearch)
    );
  });
  const sortedBillingAccounts = [...filteredBillingAccounts].sort((a, b) => {
    switch (billingSort) {
      case "due-desc":
        return b.totalDue - a.totalDue;
      case "owner-asc":
        return a.ownerName.localeCompare(b.ownerName);
      case "owner-desc":
        return b.ownerName.localeCompare(a.ownerName);
      case "status": {
        const statusOrder: Record<BillingAccountRow["status"], number> = {
          Unpaid: 0,
          Partial: 1,
          Paid: 2,
          Overpaid: 3,
        };
        const diff = statusOrder[a.status] - statusOrder[b.status];
        if (diff !== 0) return diff;
        return b.balance - a.balance;
      }
      case "balance-desc":
      default:
        return b.balance - a.balance;
    }
  });
  const billingTotals = filteredBillingAccounts.reduce(
    (acc, account) => {
      acc.totalDue += account.totalDue;
      acc.totalPaid += account.totalPaid;
      acc.balance += account.balance;
      acc.overpayment += account.overpayment;
      return acc;
    },
    { totalDue: 0, totalPaid: 0, balance: 0, overpayment: 0 }
  );

  const handleCheckIn = async (id: string) => {
    const guest = guestsWithBookings.find(g => g.id === id);
    if (guest?.booking) {
      try {
        await updateBooking.mutateAsync({
          id: guest.booking.id,
          updates: { status: 'checked-in', check_in: new Date().toISOString() }
        });

        if (guest.booking.room_number && guest.booking.room_number !== "TBA") {
          const { error: roomError } = await supabase
            .from("rooms")
            .update({
              occupancy_status: "occupied",
              current_guest_id: guest.id,
              current_booking_id: guest.booking.id,
            })
            .eq("number", guest.booking.room_number);

          if (roomError) throw roomError;
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }

        toast.success("Guest checked in successfully");
      } catch (error: any) {
        console.error("Check-in error:", error);
        toast.error(error?.message || "Failed to check in guest");
      }
    }
  };

  const handleCheckOut = async (id: string) => {
    const guest = guestsWithBookings.find(g => g.id === id);
    if (guest?.booking) {
      try {
        await updateBooking.mutateAsync({
          id: guest.booking.id,
          updates: { status: 'checked-out', check_out: new Date().toISOString() }
        });

        if (guest.booking.room_number && guest.booking.room_number !== "TBA") {
          const { error: roomError } = await supabase
            .from("rooms")
            .update({
              occupancy_status: "checkout",
              cleaning_status: "dirty",
              current_guest_id: null,
              current_booking_id: null,
            })
            .eq("number", guest.booking.room_number);

          if (roomError) throw roomError;
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }

        toast.success("Guest checked out. Room moved to checkout for assessment/cleaning.");
        await sendReviewRequest(guest);
        queryClient.invalidateQueries({ queryKey: ["review_requests"] });
      } catch (error: any) {
        console.error("Checkout flow error:", error);
        toast.error(error?.message || "Failed to complete checkout");
      }
    }
  };

  const handleRecordPayment = async (
    id: string,
    amount: number,
    method: "mpesa" | "withdraw" | "card" | "bank-transfer"
  ) => {
    const guest = guestsWithBookings.find(g => g.id === id);
    if (!guest?.booking) return;
    const currentPaid = guest.booking.paid_amount || 0;
    const total = guest.booking.total_amount || 0;

    const guestPos = posTransactions.filter((t) =>
      isPosTransactionForGuestStay(t, guest.id, guest.booking)
    );
    const pendingPos = guestPos.filter((t) => t.status === "pending");
    const completedPosTotal = guestPos
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.total, 0);
    const pendingTotal = pendingPos.reduce((sum, t) => sum + t.total, 0);

    const assessment =
      roomAssessments.find((a) => a.booking_id === guest.booking.id) ||
      roomAssessments.find((a) => a.guest_id === guest.id);
    const assessmentMissing = assessment && Array.isArray(assessment.missing_items) ? assessment.missing_items : [];
    const assessmentMissingCost = assessmentMissing.reduce(
      (sum: number, item: any) => sum + (Number(item.cost) || 0),
      0
    );
    const assessmentCost = Number(assessment?.damage_cost || 0) + Number(assessmentMissingCost);

    const paidTotalBefore = currentPaid + completedPosTotal;
    const totalDue = total + pendingTotal + assessmentCost;

    const nextPaid = currentPaid + amount;
    await updateBooking.mutateAsync({
      id: guest.booking.id,
      updates: { paid_amount: nextPaid },
    });

    if (pendingPos.length > 0 && paidTotalBefore + amount >= totalDue) {
      await Promise.all(
        pendingPos.map((txn) =>
          updatePOSTransaction.mutateAsync({
            id: txn.id,
            updates: { status: "completed", payment_method: method },
          })
        )
      );
      toast.success("POS charges marked as paid");
    } else if (pendingPos.length > 0) {
      toast.warning("Payment recorded. POS charges still pending (partial payment).");
    }

    toast.success(`Payment of Ksh ${amount} recorded`);
  };

  const handleUpdateRequestStatus = (id: string, status: GuestRequest["status"]) => {
    updateIssue.mutate({ id, resolved: status === 'completed' });
  };

  const handleAssignRoom = (booking: ConfirmedBooking) => {
    setSelectedBooking(booking);
    setRoomAssignmentOpen(true);
  };

  const handleRoomAssigned = () => {
    refetchBookings();
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["guests"] });
  };

  const isLoadingAll = guestsLoading || bookingsLoading || posLoading || refundsLoading;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Guest Management</h1>
            <p className="text-muted-foreground">
              Track guest journeys from booking to checkout
            </p>
          </div>
          <Button onClick={() => setBookingOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Guests"
            value={stats.totalGuests}
            icon={Users}
            description="Active bookings"
          />
          <StatCard
            title="Checked In"
            value={stats.checkedIn}
            icon={UserCheck}
            trend={{ value: 12, isPositive: true }}
            description="Currently staying"
          />
          <StatCard
            title="Arriving Today"
            value={stats.preArrival}
            icon={Clock}
            description="Expected check-ins"
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={CalendarCheck}
            trend={stats.pendingRequests > 0 ? { value: stats.pendingRequests, isPositive: false } : undefined}
            description="Awaiting room assignment"
          />
        </div>

        {isLoadingAll ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="guests">Guests</TabsTrigger>
              <TabsTrigger value="requests">Requests ({confirmedBookings.length})</TabsTrigger>
              <TabsTrigger value="history">History ({historyGuestData.length})</TabsTrigger>
              <TabsTrigger value="billing-accounts">Billing Accounts ({billingAccountRows.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="guests" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, room, or email..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                    <TabsTrigger value="pre-arrival">Pre-Arrival</TabsTrigger>
                    <TabsTrigger value="checked-out">Checked Out</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Guest Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGuests.map((guest) => (
                  <GuestCard 
                    key={guest.id} 
                    guest={guest}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    onRecordPayment={handleRecordPayment}
                  />
                ))}
              </div>

              {filteredGuests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No guests found matching your criteria
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {confirmedBookings.map((booking) => (
                  <ConfirmedBookingCard
                    key={booking.id}
                    booking={booking}
                    onAssignRoom={handleAssignRoom}
                  />
                ))}
              </div>

              {confirmedBookings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No confirmed bookings awaiting room assignment
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, room, or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredHistoryGuests.map((guest) => (
                  <GuestCard
                    key={`${guest.id}-${guest.bookingId || "history"}`}
                    guest={guest}
                  />
                ))}
              </div>

              {filteredHistoryGuests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No settled checkout history records found
                </div>
              )}
            </TabsContent>

            <TabsContent value="billing-accounts" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search account by owner, phone, email, or status..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Tabs value={billingSort} onValueChange={setBillingSort}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="balance-desc">Balance</TabsTrigger>
                  <TabsTrigger value="due-desc">Total Due</TabsTrigger>
                  <TabsTrigger value="owner-asc">Owner A-Z</TabsTrigger>
                  <TabsTrigger value="owner-desc">Owner Z-A</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                </TabsList>
              </Tabs>

              {sortedBillingAccounts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No billing accounts found
                </div>
              ) : (
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Billing Owner / Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead className="text-right">Paid (Net)</TableHead>
                        <TableHead className="text-right">Balance / Overpayment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBillingAccounts.map((account) => {
                        const statusClass =
                          account.status === "Paid"
                            ? "bg-status-available/20 text-status-available"
                            : account.status === "Overpaid"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : account.status === "Partial"
                                ? "bg-status-checkout/20 text-status-checkout"
                                : "bg-status-maintenance/20 text-status-maintenance";
                        const balanceLabel =
                          account.overpayment > 0
                            ? `Over ${formatKsh(account.overpayment)}`
                            : formatKsh(account.balance);

                        return (
                          <TableRow key={account.ownerId}>
                            <TableCell>
                              <div className="font-medium">{account.ownerName}</div>
                              <div className="text-xs text-muted-foreground">
                                Room {formatKsh(account.roomTotal)} • POS Pending {formatKsh(account.posPending)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>{account.ownerPhone}</div>
                              <div className="text-xs text-muted-foreground">{account.ownerEmail}</div>
                            </TableCell>
                            <TableCell className="text-right">{account.bookingCount}</TableCell>
                            <TableCell className="text-right font-medium">{formatKsh(account.totalDue)}</TableCell>
                            <TableCell className="text-right font-medium text-status-available">
                              {formatKsh(account.totalPaid)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${
                                account.overpayment > 0
                                  ? "text-blue-600"
                                  : account.balance > 0
                                    ? "text-status-maintenance"
                                    : "text-status-available"
                              }`}
                            >
                              {balanceLabel}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusClass}>{account.status}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3}>Totals</TableCell>
                        <TableCell className="text-right">{formatKsh(billingTotals.totalDue)}</TableCell>
                        <TableCell className="text-right">{formatKsh(billingTotals.totalPaid)}</TableCell>
                        <TableCell className="text-right">
                          {billingTotals.overpayment > 0
                            ? `Over ${formatKsh(billingTotals.overpayment)}`
                            : formatKsh(billingTotals.balance)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BookingWizard open={bookingOpen} onOpenChange={setBookingOpen} />
      
      <RoomAssignmentModal
        open={roomAssignmentOpen}
        onOpenChange={setRoomAssignmentOpen}
        booking={selectedBooking}
        onAssigned={handleRoomAssigned}
      />
    </MainLayout>
  );
};

export default Guests;
