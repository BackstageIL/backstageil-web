/**
 * The vendors directory (BSIL-79): filters by category and region, and contact links.
 * A vendor with no districts serves the whole country.
 */
import type { components } from "./api-types";
import type { Vendor, VendorCategory } from "./api";

type District = components["schemas"]["District"];

/** Categories in the order the filter shows them */
export const CATEGORIES: readonly VendorCategory[] = [
  "sound",
  "lighting",
  "video",
  "dj_effects",
  "staging",
  "backline",
  "power",
  "transport",
  "crew",
  "other",
];

export const DISTRICTS: readonly District[] = [
  "north",
  "haifa",
  "center",
  "tel_aviv",
  "jerusalem",
  "south",
  "judea_samaria",
];

export interface VendorFilters {
  category: VendorCategory | "";
  district: District | "";
}

export function servesDistrict(
  vendor: Pick<Vendor, "districts">,
  district: District | "",
): boolean {
  return district === "" || vendor.districts.length === 0 || vendor.districts.includes(district);
}

export function filterVendors<V extends Pick<Vendor, "categories" | "districts">>(
  vendors: V[],
  { category, district }: VendorFilters,
): V[] {
  return vendors.filter(
    (vendor) =>
      (category === "" || vendor.categories.includes(category)) && servesDistrict(vendor, district),
  );
}

/** Every category in filter order, with how many vendors offer it (0 too: the filter shows them all). */
export function categoryCounts(
  vendors: Pick<Vendor, "categories">[],
): { category: VendorCategory; count: number }[] {
  return CATEGORIES.map((category) => ({
    category,
    count: vendors.filter((vendor) => vendor.categories.includes(category)).length,
  }));
}

/** The phone's digits in international form, for wa.me: "+972 54-123 4567" or "054-1234567" → "972541234567". */
export function internationalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return phone.trim().startsWith("+") ? digits : digits.replace(/^0/, "972");
}

/** A WhatsApp chat link (opens the app on phones, WhatsApp Web elsewhere). */
export function whatsappLink(phone: string): string {
  return `https://wa.me/${internationalDigits(phone)}`;
}

/** The description in the page language, falling back to the other one. */
export function descriptionIn(
  locale: "en" | "he",
  vendor: Pick<Vendor, "description" | "description_he">,
): string | null {
  return locale === "he"
    ? (vendor.description_he ?? vendor.description)
    : (vendor.description ?? vendor.description_he);
}
