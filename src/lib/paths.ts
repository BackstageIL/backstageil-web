/** Build-time page lists, shared by the English and Hebrew routes. */
import { api } from "./site-api";

export async function venuePaths() {
  const venues = await api.listVenues();
  return venues.map((venue) => ({ params: { venue: venue.slug } }));
}

export async function hallPaths() {
  const venues = await api.listVenues();
  const details = await Promise.all(venues.map((venue) => api.venue(venue.slug)));
  return details.flatMap((venue) =>
    venue.halls.map((hall) => ({ params: { venue: venue.slug, hall: hall.slug } })),
  );
}
