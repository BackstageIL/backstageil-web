import { describe, expect, it } from "vitest";

import type { VenueDetail } from "./api";
import {
  cityOptions,
  filterVenues,
  matchesQuery,
  normalize,
  outlineScale,
  toListItems,
} from "./venue-list";

function venue(slug: string, city: string, halls: [string, number | null, number | null][]) {
  return {
    slug,
    name: slug.replace(/-/g, " "),
    venue_type: "culture_hall",
    street_address: null,
    street_address_he: null,
    website: null,
    city: { slug: city, name_en: city.toUpperCase(), district: "north" },
    halls: halls.map(([name, width, depth]) => ({
      slug: name,
      name,
      capacity_seated: null,
      stage_width_m: width,
      stage_depth_m: depth,
    })),
  } as VenueDetail;
}

const venues = toListItems([
  venue("zeta-hall", "haifa", [["main", 14, 11]]),
  venue("alpha-theatre", "tel-aviv", [
    ["small", 8, 6],
    ["big", 40, 30],
  ]),
  venue("beta-club", "haifa", [["floor", null, null]]),
]);

describe("toListItems", () => {
  it("sorts venues and their halls by name", () => {
    expect(venues.map((v) => v.slug)).toEqual(["alpha-theatre", "beta-club", "zeta-hall"]);
    expect(venues[0].halls.map((h) => h.slug)).toEqual(["big", "small"]);
    expect(venues[0]).toMatchObject({
      city: { slug: "tel-aviv", name: "TEL-AVIV" },
      district: "north",
    });
  });
});

describe("cityOptions", () => {
  it("lists each city once with its venue count", () => {
    expect(cityOptions(venues)).toEqual([
      { slug: "haifa", name: "HAIFA", count: 2 },
      { slug: "tel-aviv", name: "TEL-AVIV", count: 1 },
    ]);
  });
});

describe("filterVenues", () => {
  it("shows everything with no choice", () => {
    const { venueOptions, shown } = filterVenues(venues, "", "");
    expect(venueOptions).toHaveLength(3);
    expect(shown).toHaveLength(3);
  });

  it("narrows the venue dropdown and the list to the city", () => {
    const { venueOptions, shown } = filterVenues(venues, "haifa", "");
    expect(venueOptions.map((v) => v.slug)).toEqual(["beta-club", "zeta-hall"]);
    expect(shown).toEqual(venueOptions);
  });

  it("shows one venue when chosen", () => {
    expect(filterVenues(venues, "haifa", "zeta-hall").shown.map((v) => v.slug)).toEqual([
      "zeta-hall",
    ]);
  });

  it("ignores a venue that is not in the chosen city", () => {
    expect(filterVenues(venues, "haifa", "alpha-theatre").shown).toHaveLength(2);
  });
});

describe("outlineScale", () => {
  it("fits the widest and the deepest stage of all halls", () => {
    // widest 40 m → 112 px gives 2.8; deepest 30 m → 84 px gives 2.8
    expect(outlineScale(venues, 112, 84)).toBeCloseTo(2.8);
    expect(outlineScale(venues, 112, 60)).toBeCloseTo(2);
  });

  it("is 0 without any measured stage", () => {
    expect(outlineScale(toListItems([venue("x", "c", [["h", null, null]])]), 112, 84)).toBe(0);
  });
});

describe("text search", () => {
  const [haam] = toListItems([
    {
      ...venue("beit-haam", "tel-aviv", [["main", null, null]]),
      name: "Beit HaAm Tel Aviv",
      name_he: "בית העם תל אביב",
      street_address: "2 Tarsat Blvd",
      street_address_he: 'שדרות תרס"ט 2',
      city: {
        slug: "tel-aviv",
        name_en: "Tel Aviv - Yafo",
        name_he: "תל אביב -יפו",
        district: "tel_aviv",
      },
      halls: [
        {
          slug: "rovina",
          name: "Rovina Hall",
          name_he: "אולם רובינא",
          capacity_seated: 920,
          stage_width_m: null,
          stage_depth_m: null,
        },
      ],
    } as VenueDetail,
  ]);

  it("normalizes case, niqqud, quotes, geresh and dashes", () => {
    expect(normalize("Tel Aviv - Yafo")).toBe("tel aviv yafo");
    expect(normalize('ת"א')).toBe("תא");
    expect(normalize("צ׳רלס ברונפמן")).toBe("צרלס ברונפמן");
    expect(normalize("שָׁלוֹם")).toBe("שלום");
  });

  it.each([
    ["beit haam", true],
    ["BEIT-HAAM", true],
    ["בית העם", true],
    ["tel aviv", true],
    ["תל אביב יפו", true],
    ["rovina", true],
    ["רובינא", true],
    ['תרס"ט', true],
    ['ת"א', true],
    ["ת״א", true],
    ["TLV", true],
    ["haifa", false],
    ["beit haifa", false],
  ])("%s → %s", (query, expected) => {
    expect(matchesQuery(haam, query)).toBe(expected);
  });

  it("doesn't match an abbreviation inside other words", () => {
    const [tzavta] = toListItems([
      {
        ...venue("tzavta", "tel-aviv", []),
        name: "Tzavta",
        name_he: "צוותא",
        city: { slug: "x", name_en: "X", name_he: "רמת גן", district: null },
      } as VenueDetail,
    ]);
    expect(matchesQuery(tzavta, 'ת"א')).toBe(false);
  });

  it("combines with the city filter", () => {
    const all = [...venues, haam];
    expect(
      filterVenues(all, "", "", "hall")
        .shown.map((v) => v.slug)
        .sort(),
    ).toEqual(["beit-haam", "zeta-hall"]);
    expect(filterVenues(all, "haifa", "", "hall").shown.map((v) => v.slug)).toEqual(["zeta-hall"]);
    expect(filterVenues(all, "", "", "nothing like this").shown).toEqual([]);
  });
});
