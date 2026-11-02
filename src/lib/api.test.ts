import { describe, expect, it, vi } from "vitest";

import { ApiError, createApi } from "./api";

const BASE = "https://api.example.test";
const SNAPSHOT_URL = `${BASE}/api/v1/site/snapshot`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const snapshot = {
  venues: [
    {
      summary: { slug: "alpha", hall_count: 2 },
      detail: { slug: "alpha", halls: [{ slug: "main" }, { slug: "small" }] },
      pictures: [{ id: 1 }],
      recommendations: [{ id: 2 }],
      halls: [
        { document: { slug: "main", name: "Main" }, pictures: [{ id: 3 }] },
        { document: { slug: "small", name: "Small" }, pictures: [] },
      ],
    },
    {
      summary: { slug: "beta", hall_count: 1 },
      detail: { slug: "beta", halls: [{ slug: "main" }] },
      pictures: [],
      recommendations: [],
      halls: [{ document: { slug: "main", name: "Beta main" }, pictures: [{ id: 4 }] }],
    },
  ],
};

function apiWith(fetch: typeof globalThis.fetch) {
  return createApi(`${BASE}/`, { fetch, retryDelayMs: 0 });
}

describe("createApi", () => {
  it("answers every method from one call to the snapshot", async () => {
    const fetch = vi.fn(async (_url: string | URL | Request) => json(snapshot));
    const api = apiWith(fetch);

    const venues = await api.listVenues();
    const [detail, hall, otherHall, pictures, venuePictures, places] = await Promise.all([
      api.venue("alpha"),
      api.hall("alpha", "small"),
      api.hall("beta", "main"),
      api.pictures("alpha", "main"),
      api.venuePictures("alpha"),
      api.recommendations("alpha"),
    ]);

    expect(venues.map((venue) => venue.slug)).toEqual(["alpha", "beta"]);
    expect(detail.halls.map((h) => h.slug)).toEqual(["main", "small"]);
    expect(hall.name).toBe("Small");
    expect(otherHall.name).toBe("Beta main");
    expect(pictures).toEqual([{ id: 3 }]);
    expect(venuePictures).toEqual([{ id: 1 }]);
    expect(places).toEqual([{ id: 2 }]);
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([SNAPSHOT_URL]);
  });

  it("makes one call for requests that arrive together", async () => {
    const fetch = vi.fn(async () => json(snapshot));
    const api = apiWith(fetch);

    await Promise.all([api.venue("alpha"), api.venue("beta"), api.listVenues()]);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries server errors and network failures, then succeeds", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ error_code: "DATABASE_UNAVAILABLE" }, 503))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(json(snapshot));

    expect(await apiWith(fetch).recommendations("beta")).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("fails the build after the last retry", async () => {
    const fetch = vi.fn(async () => json({}, 500));

    await expect(apiWith(fetch).venue("alpha")).rejects.toThrow(
      /failed after 3 attempts: HTTP 500/,
    );
  });

  it("does not retry client errors", async () => {
    const fetch = vi.fn(async () => json({ error_code: "NOT_FOUND" }, 404));

    const error = await apiWith(fetch)
      .venue("alpha")
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("tries the snapshot again after a failed call", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({}, 404))
      .mockResolvedValueOnce(json(snapshot));
    const api = apiWith(fetch);

    await expect(api.venue("alpha")).rejects.toBeInstanceOf(ApiError);

    expect((await api.venue("alpha")).slug).toBe("alpha");
  });

  it.each([
    ["venue", (api: ReturnType<typeof apiWith>) => api.venue("gone")],
    ["venue pictures", (api: ReturnType<typeof apiWith>) => api.venuePictures("gone")],
    ["recommendations", (api: ReturnType<typeof apiWith>) => api.recommendations("gone")],
    ["hall", (api: ReturnType<typeof apiWith>) => api.hall("alpha", "gone")],
    ["hall pictures", (api: ReturnType<typeof apiWith>) => api.pictures("gone", "main")],
  ])("reports a missing %s as a 404", async (_name, call) => {
    const error = await call(apiWith(vi.fn(async () => json(snapshot)))).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
  });
});
