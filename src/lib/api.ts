/**
 * Typed client for the BackstageIL API, used at build time only (visitors never call the API).
 *
 * Every call is memoized for the build, so a venue fetched for one page is not fetched again
 * for another. Server errors and network failures are retried; anything still failing throws,
 * which fails the build loudly instead of publishing a page with missing data.
 */
import type { components } from "./api-types";

type Schemas = components["schemas"];
export type VenueSummary = Schemas["VenueSummary"];
export type VenueDetail = Schemas["VenueDetail"];
export type HallDocument = Schemas["HallDocument"];
export type Picture = Schemas["Picture"];
export type Recommendation = Schemas["Recommendation"];
type VenuePage = Schemas["VenuePage"];

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

const PAGE_SIZE = 100; // the API's maximum

export function createApi(baseUrl: string, options: ApiOptions = {}) {
  const fetchImpl = options.fetch ?? fetch;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const root = `${baseUrl.replace(/\/+$/, "")}/api/v1`;
  const cache = new Map<string, Promise<unknown>>();

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

  function get<T>(path: string): Promise<T> {
    let pending = cache.get(path) as Promise<T> | undefined;
    if (pending === undefined) {
      pending = request<T>(path);
      cache.set(path, pending);
      pending.catch(() => cache.delete(path)); // a later call may try again
    }
    return pending;
  }

  const slug = encodeURIComponent;

  return {
    /** All published venues, every page of the list. */
    async listVenues(): Promise<VenueSummary[]> {
      const venues: VenueSummary[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await get<VenuePage>(`/venues?limit=${PAGE_SIZE}&offset=${offset}`);
        venues.push(...page.items);
        if (page.items.length === 0 || venues.length >= page.total) return venues;
      }
    },
    venue: (venueSlug: string) => get<VenueDetail>(`/venues/${slug(venueSlug)}`),
    hall: (venueSlug: string, hallSlug: string) =>
      get<HallDocument>(`/venues/${slug(venueSlug)}/halls/${slug(hallSlug)}`),
    pictures: (venueSlug: string, hallSlug: string) =>
      get<Picture[]>(`/venues/${slug(venueSlug)}/halls/${slug(hallSlug)}/pictures`),
    recommendations: (venueSlug: string) =>
      get<Recommendation[]>(`/venues/${slug(venueSlug)}/recommendations`),
  };
}

export type Api = ReturnType<typeof createApi>;
