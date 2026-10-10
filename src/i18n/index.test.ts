import { describe, expect, it } from "vitest";

import type { VenueDetail } from "../lib/api";
import { formatValue } from "../lib/hall-sections";
import { toListItems } from "../lib/venue-list";
import { cityName, languageOptions, localePath, nameIn, pathWithoutLocale, strings } from ".";

/** Every key path of a dictionary, with the kind of value it holds. */
function shape(value: unknown, path = ""): string[] {
  if (typeof value === "function") return [`${path}:function`];
  if (Array.isArray(value)) return [`${path}:array(${value.length})`];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => shape(child, `${path}.${key}`));
  }
  return [`${path}:${typeof value}`];
}

describe("dictionaries", () => {
  it("have exactly the same keys in English and Hebrew", () => {
    expect(shape(strings("he")).sort()).toEqual(shape(strings("en")).sort());
  });

  it("name each language in its own language", () => {
    expect(strings("en").locale.names).toEqual({ en: "English", he: "עברית" });
    expect(strings("he").locale.names).toEqual(strings("en").locale.names);
  });
});

describe("paths", () => {
  it.each([
    ["en", "/", "/"],
    ["he", "/", "/he/"],
    ["he", "/venues/x/halls/main/", "/he/venues/x/halls/main/"],
    ["en", "contact/", "/contact/"],
  ] as const)("localePath(%s, %s) → %s", (locale, path, expected) => {
    expect(localePath(locale, path)).toBe(expected);
  });

  it.each([
    ["/he/", "/"],
    ["/he", "/"],
    ["/he/venues/x/", "/venues/x/"],
    ["/venues/x/", "/venues/x/"],
    ["/help/", "/help/"], // not a language prefix
  ])("pathWithoutLocale(%s) → %s", (path, expected) => {
    expect(pathWithoutLocale(path)).toBe(expected);
  });

  it("lists every language with the same page in it", () => {
    expect(languageOptions("he", "/he/venues/x/")).toEqual([
      { locale: "en", name: "English", code: "EN", href: "/venues/x/", current: false },
      { locale: "he", name: "עברית", code: "HE", href: "/he/venues/x/", current: true },
    ]);
    expect(languageOptions("en", "/").map((o) => [o.href, o.current])).toEqual([
      ["/", true],
      ["/he/", false],
    ]);
  });
});

describe("names", () => {
  it("uses the Hebrew name on Hebrew pages when there is one", () => {
    expect(nameIn("he", { name: "Main hall", name_he: "אולם ראשי" })).toBe("אולם ראשי");
    expect(nameIn("en", { name: "Main hall", name_he: "אולם ראשי" })).toBe("Main hall");
    expect(nameIn("he", { name: "Main hall", name_he: null })).toBe("Main hall");
    expect(cityName("he", { name_en: "Haifa", name_he: "חיפה" })).toBe("חיפה");
    expect(cityName("en", { name_en: "Haifa", name_he: "חיפה" })).toBe("Haifa");
  });

  it("sorts the Hebrew list in Hebrew alphabetical order", () => {
    const venue = (slug: string, name: string, nameHe: string) =>
      ({
        slug,
        name,
        name_he: nameHe,
        venue_type: "theater",
        street_address: null,
        website: null,
        city: { slug: "c", name_en: "C", name_he: "ע", district: null },
        halls: [],
      }) as VenueDetail;
    const details = [venue("a", "Alpha", "תיאטרון"), venue("b", "Beta", "אולם")];

    expect(toListItems(details, "en").map((v) => v.name)).toEqual(["Alpha", "Beta"]);
    expect(toListItems(details, "he").map((v) => v.name)).toEqual(["אולם", "תיאטרון"]);
  });
});

describe("Hebrew formatting", () => {
  const he = strings("he");

  it.each([
    ["stage_width_m", "meters", 14, "14 מ׳"],
    ["pipe_load_kg", "kg", 250, "250 ק״ג"],
    ["capacity_seated", "count", 2479, "2,479"],
    ["power_circuits_a", "amps", [32, 63], "32 A, 63 A"],
    ["has_showers", "bool", true, "כן"],
    ["haze_allowed", "allowed", false, "אסור"],
    ["stage_floor", "enum", "wood", "עץ"],
  ] as const)("%s → %s", (field, kind, value, expected) => {
    expect(formatValue(field, kind, value, he)).toBe(expected);
  });
});
