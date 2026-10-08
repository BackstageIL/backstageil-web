import { describe, expect, it } from "vitest";

import type { Recommendation } from "./api";
import { mailto } from "./contact";
import { distance, groupNearby, mapsLink, telLink } from "./nearby";

const place = (name: string, category: Recommendation["category"]) =>
  ({ id: 1, name, category, is_sponsored: false }) as Recommendation;

describe("groupNearby", () => {
  it("splits crew essentials from food and stay, keeping the API's order", () => {
    const groups = groupNearby([
      place("Hotel", "hotel"),
      place("Music store", "music_store"),
      place("Cafe", "coffee"),
      place("Parking", "parking"),
      place("Other", "other"),
    ]);

    expect(groups.crew.map((p) => p.name)).toEqual(["Music store", "Parking", "Other"]);
    expect(groups.food.map((p) => p.name)).toEqual(["Hotel", "Cafe"]);
  });
});

describe("helpers", () => {
  it.each([
    [0, "0 m away"],
    [7, "10 m away"],
    [354, "350 m away"],
    [999, "1000 m away"],
    [1000, "1 km away"],
    [1240, "1.2 km away"],
  ])("distance(%i) → %s", (meters, expected) => {
    expect(distance(meters)).toBe(expected);
  });

  it("dials the digits of a business phone", () => {
    expect(telLink("+972 4-123 4567")).toBe("tel:+97241234567");
    expect(telLink("03-555 1234")).toBe("tel:035551234");
  });

  it("searches the venue on Google Maps", () => {
    expect(mapsLink(["Beit HaAm", null, "Kefar Blum"])).toBe(
      "https://www.google.com/maps/search/?api=1&query=Beit%20HaAm%2C%20Kefar%20Blum%2C%20Israel",
    );
  });

  it("pre-fills the email subject", () => {
    expect(mailto("a@example.com", "Correction: Main hall, Beit HaAm")).toBe(
      "mailto:a@example.com?subject=Correction%3A%20Main%20hall%2C%20Beit%20HaAm",
    );
  });
});
