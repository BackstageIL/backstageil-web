/**
 * Structured data for search engines (BSIL-60): schema.org JSON-LD that tells Google what each page
 * is about (a venue, a hall in it, where it is, how many seats) and where it sits in the site.
 * Facts only, from the same API data the page shows. Not visible to visitors.
 */
import { cityName, localePath, nameIn, streetAddress, strings, type Locale } from "../i18n";
import type { HallDocument, VenueDetail } from "./api";

export type JsonLd = Record<string, unknown>;

const CONTEXT = "https://schema.org";

/** Our venue types as schema.org place types. */
const PLACE_TYPES: Record<string, string> = {
  theater: "PerformingArtsTheater",
  culture_hall: "PerformingArtsTheater",
  concert_hall: "MusicVenue",
  club: "MusicVenue",
  arena: "StadiumOrArena",
  amphitheater: "EventVenue",
  outdoor: "EventVenue",
  other: "EventVenue",
};

const absolute = (site: URL | string, path: string) => new URL(path, site).href;
const venuePath = (locale: Locale, slug: string) => localePath(locale, `/venues/${slug}/`);
const hallPath = (locale: Locale, venue: string, hall: string) =>
  localePath(locale, `/venues/${venue}/halls/${hall}/`);

/** The name in the other language, when it is different. */
function alternateName(locale: Locale, item: { name: string; name_he?: string | null }) {
  const other = nameIn(locale === "he" ? "en" : "he", item);
  return other !== nameIn(locale, item) ? { alternateName: other } : {};
}

const seats = (value: number | null | undefined) =>
  typeof value === "number" && value > 0 ? { maximumAttendeeCapacity: value } : {};

function address(
  locale: Locale,
  venue: {
    street_address?: string | null;
    street_address_he?: string | null;
    city: { name_en: string; name_he?: string | null };
  },
): JsonLd {
  const street = streetAddress(locale, venue);
  return {
    "@type": "PostalAddress",
    ...(street ? { streetAddress: street } : {}),
    addressLocality: cityName(locale, venue.city),
    addressCountry: "IL",
  };
}

function breadcrumbs(site: URL | string, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(site, item.path),
    })),
  };
}

/** The home page: the site itself. */
export function websiteJsonLd(locale: Locale, site: URL | string): JsonLd {
  const t = strings(locale).site;
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: t.name,
    url: absolute(site, localePath(locale, "/")),
    description: t.tagline,
    inLanguage: locale,
  };
}

/** A venue page: the place, its halls, and the path to it. */
export function venueJsonLd(
  locale: Locale,
  venue: VenueDetail,
  site: URL | string,
  imagePath: string,
): JsonLd[] {
  const url = absolute(site, venuePath(locale, venue.slug));
  const capacities = venue.halls.map((hall) => hall.capacity_seated ?? 0);
  const largest = Math.max(0, ...capacities);
  const place: JsonLd = {
    "@context": CONTEXT,
    "@type": PLACE_TYPES[venue.venue_type] ?? "EventVenue",
    "@id": `${url}#venue`,
    name: nameIn(locale, venue),
    ...alternateName(locale, venue),
    url,
    image: absolute(site, imagePath),
    address: address(locale, venue),
    ...seats(largest),
    ...(venue.website ? { sameAs: venue.website } : {}),
    containsPlace: venue.halls.map((hall) => ({
      "@type": "EventVenue",
      name: nameIn(locale, hall),
      url: absolute(site, hallPath(locale, venue.slug, hall.slug)),
      ...seats(hall.capacity_seated),
    })),
  };
  return [
    place,
    breadcrumbs(site, [
      { name: strings(locale).site.name, path: localePath(locale, "/") },
      { name: nameIn(locale, venue), path: venuePath(locale, venue.slug) },
    ]),
  ];
}

/** A hall page: the hall, inside its venue, and the path to it. */
export function hallJsonLd(
  locale: Locale,
  hall: HallDocument,
  site: URL | string,
  imagePath: string,
): JsonLd[] {
  const venue = hall.venue;
  const url = absolute(site, hallPath(locale, venue.slug, hall.slug));
  const venueUrl = absolute(site, venuePath(locale, venue.slug));
  const place: JsonLd = {
    "@context": CONTEXT,
    "@type": "EventVenue",
    name: `${nameIn(locale, hall)}, ${nameIn(locale, venue)}`,
    url,
    image: absolute(site, imagePath),
    address: address(locale, venue),
    ...seats(hall.capacity_seated),
    containedInPlace: {
      "@type": "Place",
      "@id": `${venueUrl}#venue`,
      name: nameIn(locale, venue),
      url: venueUrl,
    },
  };
  return [
    place,
    breadcrumbs(site, [
      { name: strings(locale).site.name, path: localePath(locale, "/") },
      { name: nameIn(locale, venue), path: venuePath(locale, venue.slug) },
      { name: nameIn(locale, hall), path: hallPath(locale, venue.slug, hall.slug) },
    ]),
  ];
}

/** JSON for a <script type="application/ld+json">: "<" escaped so data can never close the tag. */
export function jsonLdText(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
