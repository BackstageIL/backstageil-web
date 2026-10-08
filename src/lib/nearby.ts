/**
 * Places near a venue, in two groups: crew essentials (free listings) and food & stay (paid
 * listings). The API already orders them: running sponsorships first, then the venue's order.
 */
import type { components } from "./api-types";
import type { Recommendation } from "./api";

type Category = components["schemas"]["RecommendationCategory"];
export type NearbyGroupId = "crew" | "food";

const GROUP: Record<Category, NearbyGroupId> = {
  music_store: "crew",
  pharmacy: "crew",
  supermarket: "crew",
  parking: "crew",
  other: "crew",
  food: "food",
  coffee: "food",
  bar: "food",
  hotel: "food",
};

export function groupNearby(places: Recommendation[]): Record<NearbyGroupId, Recommendation[]> {
  const groups: Record<NearbyGroupId, Recommendation[]> = { crew: [], food: [] };
  for (const place of places) groups[GROUP[place.category]].push(place);
  return groups;
}

/** "350 m away", "1.2 km away" */
export function distance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10 || meters} m away`;
  return `${Number((meters / 1000).toFixed(1))} km away`;
}

/** A tel: link from a business phone as written ("+972 4-123 4567" → "tel:+97241234567"). */
export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

const searchQuery = (parts: (string | null | undefined)[]) =>
  encodeURIComponent([...parts.filter(Boolean), "Israel"].join(", "));

/** A Google Maps search for the venue (no API key needed). */
export function mapsLink(parts: (string | null | undefined)[]): string {
  return `https://www.google.com/maps/search/?api=1&query=${searchQuery(parts)}`;
}

/** Waze search for the venue, ready to navigate (opens the app on phones). */
export function wazeLink(parts: (string | null | undefined)[]): string {
  return `https://waze.com/ul?q=${searchQuery(parts)}&navigate=yes`;
}
