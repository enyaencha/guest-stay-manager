export interface GuestPhoneLookupResult {
  id: string | null;
  name: string;
  phone: string;
  email: string | null;
  id_number: string | null;
}

export const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

export const maskEmail = (email: string | null | undefined) => {
  if (!email) return "Not provided";

  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) return "***";

  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  const hiddenLocalLength = Math.max(localPart.length - visibleLocal.length, 2);

  const [domainName, ...domainSuffixParts] = domainPart.split(".");
  const visibleDomain = domainName ? domainName.slice(0, 1) : "";
  const hiddenDomainLength = Math.max((domainName || "").length - visibleDomain.length, 2);
  const maskedDomainBase = `${visibleDomain}${"*".repeat(hiddenDomainLength)}`;
  const maskedDomainSuffix = domainSuffixParts.length > 0 ? `.${domainSuffixParts.join(".")}` : "";

  return `${visibleLocal}${"*".repeat(hiddenLocalLength)}@${maskedDomainBase}${maskedDomainSuffix}`;
};

export const maskIdNumber = (idNumber: string | null | undefined) => {
  if (!idNumber) return "Not provided";
  const trimmed = idNumber.trim();
  if (!trimmed) return "Not provided";
  if (trimmed.length <= 2) return "*".repeat(trimmed.length);

  const visibleTail = trimmed.slice(-2);
  const hiddenLength = Math.max(trimmed.length - 2, 4);
  return `${"*".repeat(hiddenLength)}${visibleTail}`;
};
