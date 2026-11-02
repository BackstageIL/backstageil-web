/**
 * Typed client for the BackstageIL API, used at build time only (visitors never call the API).
 *
 * A build makes one call: the site snapshot holds all published data, and every method below reads
 * from it (BSIL-74, a call per venue and hall used up the API's free CPU). Server errors and
 * network failures are retried; anything still failing throws, which fails the build loudly
 * instead of publishing a page with missing data.
 */
import type { components } from "./api-types";

type Schemas = components["schemas"];
export type VenueSummary = Schemas["VenueSummary"];
export type VenueDetail = Schemas["VenueDetail"];
export type HallDocument = Schemas["HallDocument"];
export type Picture = Schemas["Picture"];
export type Recommendation = Schemas["Recommendation"];
type SiteSnapshot = Schemas["SiteSnapshot"];
type SiteVenue = Schemas["SiteVenue"];
type SiteHall = Schemas["SiteHall"];

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiOptions {
  fetch?: typeof fetch;
  retries?: number;
  retryDelayMs?: number;
}

interface Snapshot {
  venues: SiteVenue[];
  venueBySlug: Map<string, SiteVenue>;
  hallBySlug: Map<string, SiteHall>; // by hallKey()
}

function hallKey(venueSlug: string, hallSlug: string): string {
  return `${venueSlug}/${hallSlug}`; // slugs have no "/"
}

function indexSnapshot({ venues }: SiteSnapshot): Snapshot {
  return {
    venues,
    venueBySlug: new Map(venues.map((venue) => [venue.summary.slug, venue])),
    hallBySlug: new Map(
      venues.flatMap((venue) =>
        venue.halls.map((hall) => [hallKey(venue.summary.slug, hall.document.slug), hall] as const),
      ),
    ),
  };
}

export function createApi(baseUrl: string, options: ApiOptions = {}) {
  const fetchImpl = options.fetch ?? fetch;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const root = `${baseUrl.replace(/\/+$/, "")}/api/v1`;
  let pending: Promise<Snapshot> | undefined;

  async function request<T>(path: string): Promise<T> {
    let lastError = "";
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      let response: Response;
      try {
        response = await fetchImpl(`${root}${path}`, { headers: { Accept: "application/json" } });
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        continue;
      }
      if (response.ok) return (await response.json()) as T;
      lastError = `HTTP ${response.status}`;
      // A client error (404, 422...) will not get better by retrying
      if (response.status < 500 && response.status !== 429) {
        throw new ApiError(`GET ${path} failed: ${lastError}`, response.status);
      }
    }
    throw new ApiError(`GET ${path} failed after ${retries + 1} attempts: ${lastError}`);
  }

  function snapshot(): Promise<Snapshot> {
    if (pending === undefined) {
      pending = request<SiteSnapshot>("/site/snapshot").then(indexSnapshot);
      pending.catch(() => (pending = undefined)); // a later call may try again
    }
    return pending;
  }

  async function findVenue(venueSlug: string): Promise<SiteVenue> {
    const venue = (await snapshot()).venueBySlug.get(venueSlug);
    if (venue === undefined) throw new ApiError(`Venue not found: ${venueSlug}`, 404);
    return venue;
  }

  async function findHall(venueSlug: string, hallSlug: string): Promise<SiteHall> {
    const hall = (await snapshot()).hallBySlug.get(hallKey(venueSlug, hallSlug));
    if (hall === undefined) throw new ApiError(`Hall not found: ${venueSlug}/${hallSlug}`, 404);
    return hall;
  }

  return {
    /** All published venues. */
    async listVenues(): Promise<VenueSummary[]> {
      return (await snapshot()).venues.map((venue) => venue.summary);
    },
    venue: async (venueSlug: string): Promise<VenueDetail> => (await findVenue(venueSlug)).detail,
    hall: async (venueSlug: string, hallSlug: string): Promise<HallDocument> =>
      (await findHall(venueSlug, hallSlug)).document,
    pictures: async (venueSlug: string, hallSlug: string): Promise<Picture[]> =>
      (await findHall(venueSlug, hallSlug)).pictures,
    /** The venue's own photos (the building, the entrance); hall pictures are listed per hall */
    venuePictures: async (venueSlug: string): Promise<Picture[]> =>
      (await findVenue(venueSlug)).pictures,
    recommendations: async (venueSlug: string): Promise<Recommendation[]> =>
      (await findVenue(venueSlug)).recommendations,
  };
}

export type Api = ReturnType<typeof createApi>;
