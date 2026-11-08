import { describe, expect, it } from "vitest";

import type { Vendor } from "./api";
import {
  categoryCounts,
  descriptionIn,
  filterVendors,
  internationalDigits,
  servesDistrict,
  whatsappLink,
} from "./vendors";

type Listed = Pick<Vendor, "categories" | "districts"> & { slug: string };

const vendors: Listed[] = [
  { slug: "everywhere", categories: ["dj_effects"], districts: [] },
  { slug: "north-sound", categories: ["sound", "lighting"], districts: ["north", "haifa"] },
  { slug: "tlv-light", categories: ["lighting"], districts: ["tel_aviv"] },
];
const slugs = (list: Listed[]) => list.map((vendor) => vendor.slug);

describe("filterVendors", () => {
  it("shows everyone without filters", () => {
    expect(slugs(filterVendors(vendors, { category: "", district: "" }))).toEqual([
      "everywhere",
      "north-sound",
      "tlv-light",
    ]);
  });

  it("filters by category", () => {
    expect(slugs(filterVendors(vendors, { category: "lighting", district: "" }))).toEqual([
      "north-sound",
      "tlv-light",
    ]);
  });

  it("keeps vendors that serve the whole country in every region", () => {
    expect(slugs(filterVendors(vendors, { category: "", district: "haifa" }))).toEqual([
      "everywhere",
      "north-sound",
    ]);
    expect(servesDistrict({ districts: [] }, "south")).toBe(true);
  });

  it("combines both filters", () => {
    expect(slugs(filterVendors(vendors, { category: "lighting", district: "tel_aviv" }))).toEqual([
      "tlv-light",
    ]);
    expect(filterVendors(vendors, { category: "crew", district: "" })).toEqual([]);
  });
});

describe("categoryCounts", () => {
  it("lists every category in filter order, the empty ones too", () => {
    const counts = categoryCounts(vendors);
    expect(counts.map(({ category }) => category)).toEqual([
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
    ]);
    expect(counts.filter(({ count }) => count > 0)).toEqual([
      { category: "sound", count: 1 },
      { category: "lighting", count: 2 },
      { category: "dj_effects", count: 1 },
    ]);
  });
});

describe("contact links", () => {
  it.each([
    ["+972 54-123-4567", "972541234567"],
    ["054-1234567", "972541234567"],
    ["+1 (212) 555-0100", "12125550100"],
  ])("turns %s into international digits", (phone, digits) => {
    expect(internationalDigits(phone)).toBe(digits);
  });

  it("builds a wa.me link", () => {
    expect(whatsappLink("+972 54-123-4567")).toBe("https://wa.me/972541234567");
  });
});

describe("descriptionIn", () => {
  it("prefers the page language and falls back to the other", () => {
    const both = { description: "Rental", description_he: "השכרה" };
    expect(descriptionIn("he", both)).toBe("השכרה");
    expect(descriptionIn("en", both)).toBe("Rental");
    expect(descriptionIn("he", { description: "Rental", description_he: null })).toBe("Rental");
    expect(descriptionIn("en", { description: null, description_he: null })).toBeNull();
  });
});
