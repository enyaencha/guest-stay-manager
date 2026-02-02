import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBookings } from "@/hooks/useGuests";
import { isSameDay, parseISO } from "date-fns";

export interface Room {
  id: string;
  number: string;
  name: string;
  room_type_id: string | null;
  floor: number;
  max_occupancy: number;
  occupancy_status: string;
  cleaning_status: string;
  maintenance_status: string;
  base_price: number;
  amenities: string[];
  current_guest_id: string | null;
  current_booking_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalRooms: number;
  occupied: number;
  vacant: number;
  cleaning: number;
  maintenance: number;
  checkoutsToday: number;
  checkinsToday: number;
  occupancyRate: number;
}

export const useRooms = () => {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("number");

      if (error) throw error;
      return data as Room[];
    },
  });
};

export const useRoomStats = () => {
  const { data: rooms } = useRooms();
  const { data: bookings } = useBookings();

  const calculateStats = (rooms: Room[]): DashboardStats => {
    const occupied = rooms.filter((r) => r.occupancy_status === "occupied").length;
    const vacant = rooms.filter((r) => r.occupancy_status === "vacant").length;
    const cleaning = rooms.filter((r) => r.cleaning_status === "in-progress" || r.cleaning_status === "dirty").length;
    const maintenance = rooms.filter((r) => r.maintenance_status !== "none").length;
    const today = new Date();
    const activeBookings = bookings?.filter((booking) => booking.status !== "cancelled") || [];
    const checkinsToday = activeBookings.filter((booking) =>
      isSameDay(parseISO(booking.check_in), today)
    ).length;
    const checkoutsToday = activeBookings.filter((booking) =>
      isSameDay(parseISO(booking.check_out), today)
    ).length;

    return {
      totalRooms: rooms.length,
      occupied,
      vacant,
      cleaning,
      maintenance,
      checkoutsToday,
      checkinsToday,
      occupancyRate: rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0,
    };
  };

  return rooms ? calculateStats(rooms) : null;
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Room> }) => {
      const { data, error } = await supabase
        .from("rooms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update room: " + error.message);
    },
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (room: Omit<Room, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("rooms")
        .insert(room)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add room: " + error.message);
    },
  });
};

export const useRoomTypes = () => {
  return useQuery({
    queryKey: ["room_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .order("base_price");

      if (error) throw error;
      return data;
    },
  });
};
