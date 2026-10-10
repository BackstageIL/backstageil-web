/**
 * The home page list: venues with their halls, the City → Venue cascade, and one shared scale
 * for the stage outlines so every hall is drawn at the same size per meter.
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

/** The venues for a city (all when none), then the one venue when chosen. */
export function filterVenues(venues: VenueListItem[], city: string, venue: string) {
  const inCity = city ? venues.filter((v) => v.city.slug === city) : venues;
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
