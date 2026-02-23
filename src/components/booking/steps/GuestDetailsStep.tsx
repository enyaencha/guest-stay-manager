import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingFormData } from "@/types/booking";
import { User, Mail, Phone, Globe, CreditCard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuests } from "@/hooks/useGuests";
import { lookupGuestByPhone } from "@/lib/guestLookup";
import { GuestPhoneLookupResult, maskEmail, maskIdNumber, normalizePhoneDigits } from "@/lib/guestPrivacy";

interface GuestDetailsStepProps {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
}

const nationalities = [
  "Kenyan",
  "Ugandan",
  "Tanzanian",
  "Rwandan",
  "Ethiopian",
  "South African",
  "Nigerian",
  "British",
  "American",
  "Indian",
  "Chinese",
  "Other"
];

export function GuestDetailsStep({ formData, updateFormData }: GuestDetailsStepProps) {
  const { data: guests = [] } = useGuests();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [phoneLookup, setPhoneLookup] = useState<GuestPhoneLookupResult | null>(null);
  const [isLookingUpPhone, setIsLookingUpPhone] = useState(false);
  const [acceptedPhoneKey, setAcceptedPhoneKey] = useState<string | null>(null);
  const [declinedPhoneKey, setDeclinedPhoneKey] = useState<string | null>(null);

  const filteredGuests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return guests.filter((guest) =>
      guest.name.toLowerCase().includes(query) ||
      guest.phone.toLowerCase().includes(query) ||
      (guest.email || "").toLowerCase().includes(query)
    ).slice(0, 6);
  }, [guests, searchTerm]);

  const handleSelectGuest = (guest: { id: string; name: string; email: string | null; phone: string; id_number: string | null; }) => {
    updateFormData({
      guestId: guest.id,
      guestName: guest.name,
      guestEmail: guest.email || "",
      guestPhone: guest.phone,
      idNumber: guest.id_number || "",
    });
    setSearchTerm(`${guest.name} • ${guest.phone}`);
    setShowResults(false);
    setAcceptedPhoneKey(normalizePhoneDigits(guest.phone));
    setDeclinedPhoneKey(null);
    setPhoneLookup(null);
  };

  const handleClearGuest = () => {
    updateFormData({ guestId: undefined });
    setSearchTerm("");
    setAcceptedPhoneKey(null);
  };

  const handlePhoneChange = (value: string) => {
    const phoneKey = normalizePhoneDigits(value);
    updateFormData({ guestPhone: value, guestId: undefined });

    if (acceptedPhoneKey && acceptedPhoneKey !== phoneKey) {
      setAcceptedPhoneKey(null);
    }
    if (declinedPhoneKey && declinedPhoneKey !== phoneKey) {
      setDeclinedPhoneKey(null);
    }
  };

  const handleUseMatchedDetails = () => {
    if (!phoneLookup) return;
    const phoneKey = normalizePhoneDigits(formData.guestPhone);

    updateFormData({
      guestId: phoneLookup.id || undefined,
      guestName: phoneLookup.name || "",
      guestEmail: phoneLookup.email || "",
      guestPhone: phoneLookup.phone || formData.guestPhone,
      idNumber: phoneLookup.id_number || "",
    });
    setSearchTerm(`${phoneLookup.name} • ${phoneLookup.phone}`);
    setAcceptedPhoneKey(phoneKey || null);
    setDeclinedPhoneKey(null);
    setPhoneLookup(null);
  };

  const handleDeclineMatchedDetails = () => {
    const phoneKey = normalizePhoneDigits(formData.guestPhone);
    setDeclinedPhoneKey(phoneKey || null);
    setAcceptedPhoneKey(null);
    setPhoneLookup(null);
  };

  useEffect(() => {
    const phoneInput = formData.guestPhone.trim();
    const phoneKey = normalizePhoneDigits(phoneInput);

    if (phoneKey.length < 7) {
      setPhoneLookup(null);
      setIsLookingUpPhone(false);
      return;
    }

    if (phoneKey === acceptedPhoneKey || phoneKey === declinedPhoneKey) {
      setPhoneLookup(null);
      setIsLookingUpPhone(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsLookingUpPhone(true);
      try {
        const match = await lookupGuestByPhone(phoneInput);
        if (isCancelled) return;
        setPhoneLookup(match);
      } catch (error) {
        if (isCancelled) return;
        console.error("Guest phone lookup failed:", error);
        setPhoneLookup(null);
      } finally {
        if (!isCancelled) {
          setIsLookingUpPhone(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [formData.guestPhone, acceptedPhoneKey, declinedPhoneKey]);

  return (
    <div className="space-y-6">
      {/* Guest Lookup */}
      <div className="space-y-2">
        <Label htmlFor="guestLookup">Search Existing Guest</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="guestLookup"
            placeholder="Search by name, phone, or email"
            className="pl-10"
            value={searchTerm}
            onFocus={() => setShowResults(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
          />
          {formData.guestId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={handleClearGuest}
            >
              Clear
            </Button>
          )}
        </div>
        {showResults && filteredGuests.length > 0 && (
          <div className="rounded-md border bg-card shadow-sm">
            {filteredGuests.map((guest) => (
              <button
                key={guest.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                onClick={() => handleSelectGuest(guest)}
              >
                <div className="font-medium">{guest.name}</div>
                <div className="text-xs text-muted-foreground">
                  {guest.phone} {guest.email ? `• ${guest.email}` : ""}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary Guest Info */}
      <div className="space-y-4">
        <h3 className="font-medium">Primary Guest Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guestPhone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestPhone"
                placeholder="+254 7XX XXX XXX"
                className="pl-10"
                value={formData.guestPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
            </div>
            {isLookingUpPhone && (
              <p className="text-xs text-muted-foreground">Checking previous guest details...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestName">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestName"
                placeholder="Enter full name"
                className="pl-10"
                value={formData.guestName}
                onChange={(e) => updateFormData({ guestName: e.target.value })}
              />
            </div>
          </div>

          {phoneLookup && (
            <div className="md:col-span-2 rounded-md border bg-muted/40 p-3 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">We found previous guest details for this phone number.</p>
                <p className="text-xs text-muted-foreground">
                  Confirm first to prefill. Sensitive fields are masked until you approve.
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Name: {phoneLookup.name}</p>
                <p>Email: {maskEmail(phoneLookup.email)}</p>
                <p>ID/Passport: {maskIdNumber(phoneLookup.id_number)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={handleUseMatchedDetails}>
                  Use My Details
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleDeclineMatchedDetails}>
                  Not Me
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestEmail"
                type="email"
                placeholder="guest@email.com"
                className="pl-10"
                value={formData.guestEmail}
                onChange={(e) => updateFormData({ guestEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID/Passport Number *</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="idNumber"
                placeholder="Enter ID or passport number"
                className="pl-10"
                value={formData.idNumber}
                onChange={(e) => updateFormData({ idNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idPhoto">ID Photo (optional)</Label>
            <Input
              id="idPhoto"
              type="file"
              accept="image/*"
              onChange={(e) => updateFormData({ idPhotoFile: e.target.files?.[0] || null })}
            />
          </div>

          <div className="space-y-2">
            <Label>Nationality</Label>
            <Select
              value={formData.nationality}
              onValueChange={(value) => updateFormData({ nationality: value })}
            >
              <SelectTrigger>
                <Globe className="h-4 w-4 text-muted-foreground mr-2" />
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {nationalities.map((nat) => (
                  <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reservation Source</Label>
            <Select
              value={formData.bookingSource}
              onValueChange={(value) => updateFormData({ bookingSource: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Phone">Phone Call</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of Guests</Label>
            <Select
              value={String(formData.guestCount)}
              onValueChange={(value) => updateFormData({ guestCount: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select guest count" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={String(num)}>{num} Guest{num > 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests</Label>
        <Textarea
          id="specialRequests"
          placeholder="Any special requirements, dietary needs, accessibility needs, etc."
          rows={3}
          value={formData.specialRequests}
          onChange={(e) => updateFormData({ specialRequests: e.target.value })}
        />
      </div>
    </div>
  );
}
