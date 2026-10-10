import { describe, expect, it, vi } from "vitest";

import { ApiError, createApi } from "./api";

const BASE = "https://api.example.test";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function venue(slug: string) {
  return {
    slug,
    name: slug,
    venue_type: "club",
    street_address: null,
    street_address_he: null,
    city: { slug: "c", name_en: "C", district: null },
    hall_count: 1,
  };
}

function apiWith(fetch: typeof globalThis.fetch) {
  return createApi(`${BASE}/`, { fetch, retryDelayMs: 0 });
}

describe("createApi", () => {
  it("reads every page of the venue list", async () => {
    const fetch = vi.fn(async (url: string | URL | Request) => {
      const offset = Number(new URL(String(url)).searchParams.get("offset"));
      const all = Array.from({ length: 150 }, (_, i) => venue(`v${i}`));
      return json({ items: all.slice(offset, offset + 100), total: 150, limit: 100, offset });
    });

    const venues = await apiWith(fetch).listVenues();

    expect(venues).toHaveLength(150);
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      `${BASE}/api/v1/venues?limit=100&offset=0`,
      `${BASE}/api/v1/venues?limit=100&offset=100`,
    ]);
  });

  it("stops on an empty page even if the total is wrong", async () => {
    const fetch = vi.fn(async () => json({ items: [], total: 5, limit: 100, offset: 0 }));

    expect(await apiWith(fetch).listVenues()).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries server errors and network failures, then succeeds", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ error_code: "DATABASE_UNAVAILABLE" }, 503))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(json([]));

    expect(await apiWith(fetch).recommendations("v")).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("fails the build after the last retry", async () => {
    const fetch = vi.fn(async () => json({}, 500));

    await expect(apiWith(fetch).venue("v")).rejects.toThrow(/failed after 3 attempts: HTTP 500/);
  });

  it("does not retry client errors", async () => {
    const fetch = vi.fn(async () => json({ error_code: "VENUE_NOT_FOUND" }, 404));

    const error = await apiWith(fetch)
      .venue("gone")
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("fetches the same resource once per build", async () => {
    const fetch = vi.fn(async () => json({ slug: "v" }));
    const api = apiWith(fetch);

    await Promise.all([api.venue("v"), api.venue("v"), api.venue("v")]);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("encodes slugs and builds the documented paths", async () => {
    const fetch = vi.fn(async (_url: string | URL | Request) => json([]));
    const api = apiWith(fetch);

    await api.pictures("a b", "main");
    await api.hall("venue", "hall/x");

    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      `${BASE}/api/v1/venues/a%20b/halls/main/pictures`,
      `${BASE}/api/v1/venues/venue/halls/hall%2Fx`,
    ]);
  });
});
