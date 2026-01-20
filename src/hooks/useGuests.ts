import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  id_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  guest_id: string | null;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  paid_amount: number;
  payment_method: string | null;
  status: string;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestWithBooking extends Guest {
  booking?: Booking;
}

export const useGuests = () => {
  return useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Guest[];
    },
  });
};

export const useBookings = () => {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("check_in", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
  });
};

export const useGuestsWithBookings = () => {
  const { data: guests } = useGuests();
  const { data: bookings } = useBookings();

  if (!guests || !bookings) return [];

  return guests.map(guest => {
    const guestBooking = bookings.find(b => b.guest_id === guest.id);
    return {
      ...guest,
      booking: guestBooking,
    } as GuestWithBooking;
  });
};

export const useCreateGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guest: Omit<Guest, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("guests")
        .insert(guest)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast.success("Guest added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add guest: " + error.message);
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Omit<Booking, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create booking: " + error.message);
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update booking: " + error.message);
    },
  });
};
