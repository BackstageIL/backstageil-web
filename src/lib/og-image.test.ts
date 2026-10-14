import { describe, expect, it } from "vitest";

import type { HallDocument, VenueDetail } from "./api";
import {
  cardSvg,
  fitText,
  fontFor,
  hallCard,
  ogImagePath,
  siteCard,
  venueCard,
  type Measure,
} from "./og-image";
import { renderCard } from "./og-render";

// Every character is half the font size wide: predictable widths without a renderer
const measure: Measure = (text, _font, size) => text.length * size * 0.5;
const font = fontFor("display", "A");

const city = { slug: "haifa", name_en: "Haifa", name_he: "חיפה", district: "haifa" };
const hall = (fields: Partial<HallDocument>) =>
  ({
    slug: "main-hall",
    name: "Main hall",
    name_he: "אולם ראשי",
    venue: {
      slug: "congress-center",
      name: "Congress Center",
      name_he: "מרכז הקונגרסים",
      city,
    },
    ...fields,
  }) as HallDocument;
const venue = (halls: Partial<VenueDetail["halls"][number]>[]) =>
  ({
    slug: "congress-center",
    name: "Congress Center",
    name_he: "מרכז הקונגרסים",
    street_address: "2 Kedoshei Yassi St",
    street_address_he: "קדושי יאסי 2",
    city,
    halls: halls.map((h, i) => ({ slug: `hall-${i}`, name: `Hall ${i}`, ...h })),
  }) as VenueDetail;

describe("ogImagePath", () => {
  it("has one picture per language for the site, each venue and each hall", () => {
    expect(ogImagePath("en")).toBe("/og/en/site.png");
    expect(ogImagePath("he", { venue: "habima" })).toBe("/og/he/venues/habima.png");
    expect(ogImagePath("en", { venue: "habima", hall: "rovina" })).toBe(
      "/og/en/venues/habima/halls/rovina.png",
    );
  });
});

describe("fitText", () => {
  it("keeps short text on one line at the largest size", () => {
    expect(fitText("Habima", font, 1000, [76, 44], 2, measure)).toEqual({
      size: 76,
      lines: ["Habima"],
    });
  });

  it("wraps long text, then makes it smaller", () => {
    const fitted = fitText("Haifa International Congress Center", font, 600, [76, 44], 2, measure);
    expect(fitted.lines).toHaveLength(2);
    expect(fitted.size).toBeLessThan(76);
    for (const line of fitted.lines)
      expect(measure(line, font, fitted.size)).toBeLessThanOrEqual(600);
  });

  it("cuts what still doesn't fit at the smallest size, with an ellipsis", () => {
    const fitted = fitText("one two three four five six seven", font, 100, [40, 20], 1, measure);
    expect(fitted.size).toBe(20);
    expect(fitted.lines).toHaveLength(1);
    expect(fitted.lines[0]).toMatch(/…$/);
    expect(measure(fitted.lines[0], font, 20)).toBeLessThanOrEqual(100);
  });

  it("copes with empty text", () => {
    expect(fitText("", font, 100, [40, 20], 1, measure).lines).toEqual([""]);
  });
});

describe("hallCard", () => {
  it("shows the stage size, proscenium and seats, with the plan", () => {
    const card = hallCard(
      "en",
      hall({
        stage_width_m: 20.05,
        stage_depth_m: 12,
        proscenium_width_m: 14,
        capacity_seated: 2100,
      }),
    );
    expect(card).toMatchObject({ title: "Congress Center", subtitle: "Main hall", place: "Haifa" });
    expect(card.facts).toEqual([
      { label: "Stage", value: "20.05 × 12 m" },
      { label: "Proscenium", value: "14 m" },
      { label: "Seats", value: "2,100" },
    ]);
    expect(card.plan).not.toBeNull();
    expect(card.alt).toBe("Main hall, Congress Center. Stage 20.05 m wide and 12 m deep.");
  });

  it("uses the Hebrew names and unit on Hebrew cards", () => {
    const card = hallCard("he", hall({ stage_width_m: 14, stage_depth_m: 10 }));
    expect(card).toMatchObject({ title: "מרכז הקונגרסים", subtitle: "אולם ראשי", place: "חיפה" });
    expect(card.facts?.[0]).toEqual({ label: "במה", value: "14 × 10 מ׳" });
  });

  it("has no plan without both stage measurements", () => {
    const card = hallCard("en", hall({ stage_width_m: 14, capacity_seated: 300 }));
    expect(card.plan).toBeNull();
    expect(card.facts).toEqual([{ label: "Seats", value: "300" }]);
    expect(card.alt).toBe("Main hall, Congress Center");
  });
});

describe("venueCard", () => {
  it("lists the halls and draws the largest stage", () => {
    const card = venueCard(
      "en",
      venue([
        { stage_width_m: 10, stage_depth_m: 8, capacity_seated: 300 },
        { stage_width_m: 20, stage_depth_m: 12, capacity_seated: 2100 },
      ]),
    );
    expect(card.place).toBe("2 Kedoshei Yassi St, Haifa");
    expect(card.rows).toEqual([
      { name: "Hall 0", size: "10 × 8 m", seats: "300 seats" },
      { name: "Hall 1", size: "20 × 12 m", seats: "2,100 seats" },
    ]);
    expect(card.plan?.input).toMatchObject({ stage_width_m: 20 });
    expect(card.plan?.caption).toBe("Stage plan: Hall 1");
  });

  it("has no caption for a single hall, and no plan without measurements", () => {
    expect(
      venueCard("en", venue([{ stage_width_m: 10, stage_depth_m: 8 }])).plan?.caption,
    ).toBeNull();
    expect(venueCard("en", venue([{ capacity_seated: 80 }])).plan).toBeNull();
  });

  it("counts the halls that don't fit", () => {
    const card = venueCard("en", venue(Array.from({ length: 5 }, () => ({}))));
    const svg = cardSvg(card, measure);
    expect(svg).toContain("Hall 2");
    expect(svg).not.toContain("Hall 3");
    expect(svg).toContain("and 2 more");
  });
});

describe("cardSvg", () => {
  it("escapes names", () => {
    const svg = cardSvg({ locale: "en", title: "Rock & Roll <Club>", alt: "" }, measure);
    expect(svg).toContain("Rock &amp; Roll &lt;Club&gt;");
    expect(svg).not.toContain("<Club>");
  });

  it("writes Hebrew cards right to left, starting each line in Hebrew order", () => {
    const svg = cardSvg(siteCard("he", 132, 188), measure);
    expect(svg).toContain('direction="rtl"');
    expect(svg).toContain("‏132");
    expect(cardSvg(siteCard("en", 132, 188), measure)).not.toContain("‏");
  });

  it("draws the plan panel only when there is a plan", () => {
    const withPlan = cardSvg(
      hallCard("en", hall({ stage_width_m: 14, stage_depth_m: 10 })),
      measure,
    );
    const without = cardSvg(hallCard("en", hall({})), measure);
    expect(withPlan).toContain("Upstage");
    expect(without).not.toContain("Upstage");
  });
});

describe("renderCard", () => {
  it("makes a 1200 × 630 PNG with the site's fonts", () => {
    const png = renderCard(hallCard("he", hall({ stage_width_m: 14, stage_depth_m: 10 })));
    const view = new DataView(png.buffer);
    expect([...png.slice(1, 4)].map((c) => String.fromCharCode(c)).join("")).toBe("PNG");
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
  });
});
