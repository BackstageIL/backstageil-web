/**
 * Link preview pictures (BSIL-59), drawn at build time: /og/<locale>/site.png,
 * /og/<locale>/venues/<venue>.png and /og/<locale>/venues/<venue>/halls/<hall>.png.
 */
import type { APIRoute, GetStaticPaths } from "astro";

import { LOCALES, type Locale } from "../../i18n";
import type { VenueDetail } from "../../lib/api";
import { hallCard, ogImagePath, siteCard, venueCard } from "../../lib/og-image";
import { renderCard } from "../../lib/og-render";
import { api } from "../../lib/site-api";

type Props =
  | { locale: Locale; kind: "site"; venues: number; halls: number }
  | { locale: Locale; kind: "venue"; venue: VenueDetail }
  | { locale: Locale; kind: "hall"; venue: string; hall: string };

/** "/og/en/venues/x.png" → "en/venues/x" (the route's parameter) */
const param = (path: string) => path.slice("/og/".length, -".png".length);

export const getStaticPaths = (async () => {
  const venues = await Promise.all((await api.listVenues()).map((v) => api.venue(v.slug)));
  const halls = venues.reduce((sum, venue) => sum + venue.halls.length, 0);
  return LOCALES.flatMap((locale) => [
    {
      params: { image: param(ogImagePath(locale)) },
      props: { locale, kind: "site", venues: venues.length, halls } satisfies Props,
    },
    ...venues.flatMap((venue) => [
      {
        params: { image: param(ogImagePath(locale, { venue: venue.slug })) },
        props: { locale, kind: "venue", venue } satisfies Props,
      },
      ...venue.halls.map((hall) => ({
        params: { image: param(ogImagePath(locale, { venue: venue.slug, hall: hall.slug })) },
        props: { locale, kind: "hall", venue: venue.slug, hall: hall.slug } satisfies Props,
      })),
    ]),
  ]);
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const p = props as Props;
  const card =
    p.kind === "site"
      ? siteCard(p.locale, p.venues, p.halls)
      : p.kind === "venue"
        ? venueCard(p.locale, p.venue)
        : hallCard(p.locale, await api.hall(p.venue, p.hall));
  return new Response(renderCard(card), { headers: { "Content-Type": "image/png" } });
};
