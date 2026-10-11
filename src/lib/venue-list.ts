/**
 * The home page list: venues with their halls, the free-text search and City → Venue cascade,
 * and one shared scale for the stage outlines so every hall is drawn at the same size per meter.
 */
import { cityName, nameIn, type Locale } from "../i18n";
import type { components } from "./api-types";
import type { VenueDetail } from "./api";

type Schemas = components["schemas"];

export interface HallListItem {
  slug: string;
  name: string;
  seats: number | null;
  width: number | null;
  depth: number | null;
}

export interface VenueListItem {
  slug: string;
  name: string;
  type: Schemas["VenueType"];
  city: { slug: string; name: string };
  district: Schemas["District"] | null;
  halls: HallListItem[];
  /** Venue, city, street and hall names in both languages, normalized for the text search */
  keywords: string;
}

export interface CityOption {
  slug: string;
  name: string;
  count: number;
}

const byNameIn =
  (locale: Locale) =>
  (a: { name: string }, b: { name: string }): number =>
    a.name.localeCompare(b.name, locale, { sensitivity: "base" });

/**
 * Text for matching: lower case, without niqqud/accents, quotes or geresh (so ת"א = תא), and with
 * any other punctuation (dashes, commas) as a space.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['"`\u05F3\u05F4\u2018\u2019\u201C\u201D]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function keywordsOf(venue: VenueDetail): string {
  const texts = [
    venue.name,
    venue.name_he,
    venue.city.name_en,
    venue.city.name_he,
    venue.street_address,
    venue.street_address_he,
    ...venue.halls.flatMap((hall) => [hall.name, hall.name_he]),
  ];
  return normalize(texts.filter(Boolean).join(" "));
}

/** Common city abbreviations (after normalize, so ת"א is "תא"), searched as the full name. */
const ABBREVIATIONS: Record<string, string> = {
  תא: "תל אביב",
  בש: "באר שבע",
  פת: "פתח תקווה",
  ראשלצ: "ראשון לציון",
  tlv: "tel aviv",
};

/** True when every word of the query appears in the venue's names (any language). */
export function matchesQuery(venue: VenueListItem, query: string): boolean {
  const words = normalize(query)
    .split(" ")
    .filter(Boolean)
    .flatMap((word) => (ABBREVIATIONS[word] ?? word).split(" "));
  return words.every((word) => venue.keywords.includes(word));
}

/** Venues with their halls, names in the page language, sorted in its alphabet. */
export function toListItems(details: VenueDetail[], locale: Locale = "en"): VenueListItem[] {
  const byName = byNameIn(locale);
  return details
    .map((venue) => ({
      slug: venue.slug,
      name: nameIn(locale, venue),
      type: venue.venue_type,
      city: { slug: venue.city.slug, name: cityName(locale, venue.city) },
      district: venue.city.district,
      halls: venue.halls
        .map((hall) => ({
          slug: hall.slug,
          name: nameIn(locale, hall),
          seats: hall.capacity_seated,
          width: hall.stage_width_m,
          depth: hall.stage_depth_m,
        }))
        .sort(byName),
      keywords: keywordsOf(venue),
    }))
    .sort(byName);
}

/** Cities that have venues, in alphabetical order, with how many. */
export function cityOptions(venues: VenueListItem[], locale: Locale = "en"): CityOption[] {
  const cities = new Map<string, CityOption>();
  for (const venue of venues) {
    const city = cities.get(venue.city.slug) ?? { ...venue.city, count: 0 };
    city.count += 1;
    cities.set(city.slug, city);
  }
  return [...cities.values()].sort(byNameIn(locale));
}

/** The venues matching the text and the city (all when none), then the one venue when chosen. */
export function filterVenues(venues: VenueListItem[], city: string, venue: string, query = "") {
  const matching = query ? venues.filter((v) => matchesQuery(v, query)) : venues;
  const inCity = city ? matching.filter((v) => v.city.slug === city) : matching;
  const chosen = venue ? inCity.filter((v) => v.slug === venue) : inCity;
  return { venueOptions: inCity, shown: chosen.length ? chosen : inCity };
}

/** Pixels per meter so the widest stage fits `boxWidth` and the deepest fits `boxHeight`. */
export function outlineScale(venues: VenueListItem[], boxWidth: number, boxHeight: number): number {
  const halls = venues.flatMap((v) => v.halls);
  const widest = Math.max(0, ...halls.map((h) => h.width ?? 0));
  const deepest = Math.max(0, ...halls.map((h) => h.depth ?? 0));
  if (widest <= 0 || deepest <= 0) return 0;
  return Math.min(boxWidth / widest, boxHeight / deepest);
}
