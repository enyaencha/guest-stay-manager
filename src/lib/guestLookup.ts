import { supabase } from "@/integrations/supabase/client";
import { GuestPhoneLookupResult, normalizePhoneDigits } from "@/lib/guestPrivacy";

interface GuestRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  id_number: string | null;
}

interface ReservationRequestRow {
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
}

const mapGuestRow = (row: GuestRow): GuestPhoneLookupResult => ({
  id: row.id,
  name: row.name || "Unknown",
  phone: row.phone || "",
  email: row.email || null,
  id_number: row.id_number || null,
});

const mapReservationRequestRow = (row: ReservationRequestRow): GuestPhoneLookupResult => ({
  id: null,
  name: row.guest_name || "Unknown",
  phone: row.guest_phone || "",
  email: row.guest_email || null,
  id_number: null,
});

export const lookupGuestByPhone = async (
  phoneInput: string
): Promise<GuestPhoneLookupResult | null> => {
  const normalizedPhone = normalizePhoneDigits(phoneInput);
  if (normalizedPhone.length < 7) return null;

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
    "lookup_guest_profile_by_phone",
    { phone_input: phoneInput }
  );

  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    const row = rpcData[0] as GuestRow;
    return mapGuestRow(row);
  }

  // Fallback for environments where the RPC is not deployed yet.
  const { data: guestsData, error: guestsError } = await supabase
    .from("guests")
    .select("id, name, phone, email, id_number")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (!guestsError && Array.isArray(guestsData) && guestsData.length > 0) {
    const typedGuests = guestsData as GuestRow[];
    const guestMatch = typedGuests.find(
      (guest) => normalizePhoneDigits(guest.phone || "") === normalizedPhone
    ) as GuestRow | null;

    if (guestMatch) {
      return mapGuestRow(guestMatch);
    }
  }

  const { data: requestsData, error: requestsError } = await (supabase as any)
    .from("reservation_requests")
    .select("guest_name, guest_phone, guest_email")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!requestsError && Array.isArray(requestsData) && requestsData.length > 0) {
    const typedRequests = requestsData as ReservationRequestRow[];
    const requestMatch = typedRequests.find(
      (request) => normalizePhoneDigits(request.guest_phone || "") === normalizedPhone
    );

    if (requestMatch) {
      return mapReservationRequestRow(requestMatch);
    }
  }

  return null;
};
