import { describe, expect, it } from "vitest";

import type { HallDocument } from "./api";
import { SECTIONS, everyFieldPlaced, extraLabel, formatValue, hallSections } from "./hall-sections";

function hall(fields: Partial<HallDocument> = {}): HallDocument {
  return {
    slug: "main",
    name: "Main hall",
    name_he: null,
    venue: {
      slug: "v",
      name: "Venue",
      name_he: null,
      street_address: null,
      street_address_he: null,
      city: { slug: "c", name_en: "City", name_he: "עיר", district: null },
    },
    field_notes: {},
    extras: {},
    source: null,
    last_verified_at: null,
    power_circuits_a: [],
    ...fields,
  };
}

describe("formatValue", () => {
  it.each([
    ["capacity_seated", "count", 2479, "2,479"],
    ["stage_width_m", "meters", 14, "14 m"],
    ["stage_width_m", "meters", 12.5, "12.5 m"],
    ["pipe_load_kg", "kg", 250, "250 kg"],
    ["power_circuits_a", "amps", [32, 63, 125], "32 A, 63 A, 125 A"],
    ["power_circuits_a", "amps", [], null],
    ["has_showers", "bool", true, "Yes"],
    ["has_showers", "bool", false, "No"],
    ["haze_allowed", "allowed", true, "Allowed"],
    ["haze_allowed", "allowed", false, "Not allowed"],
    ["stage_floor", "enum", "marley", "Marley"],
    ["pipe_type", "enum", "counterweight", "Counterweight"],
    ["sightlines", "text", "  Rows 1-2 can't see feet  ", "Rows 1-2 can't see feet"],
    ["sightlines", "text", "   ", null],
    ["grid_height_m", "meters", null, null],
  ] as const)("%s (%s) %j → %j", (field, kind, value, expected) => {
    expect(formatValue(field, kind, value)).toBe(expected);
  });
});

describe("hallSections", () => {
  it("keeps only filled rows and drops empty sections", () => {
    const sections = hallSections(hall({ stage_width_m: 14, has_showers: false }));

    expect(sections.map((s) => s.id)).toEqual(["stage", "backstage"]);
    expect(sections[0].rows).toEqual([
      { field: "stage_width_m", label: "Stage width", value: "14 m", isText: false, note: null },
    ]);
    expect(sections[1].rows[0].value).toBe("No"); // false is a real answer, not "unknown"
  });

  it("shows a note even when the value is unknown, and marks free text", () => {
    const sections = hallSections(
      hall({
        load_in_notes: "High loading ramp",
        field_notes: { dressing_rooms: "2 large rooms", case_storage: "  " },
      }),
    );

    expect(sections.find((s) => s.id === "access")?.rows).toEqual([
      {
        field: "load_in_notes",
        label: "Load-in",
        value: "High loading ramp",
        isText: true,
        note: null,
      },
    ]);
    expect(sections.find((s) => s.id === "backstage")?.rows).toEqual([
      {
        field: "dressing_rooms",
        label: "Dressing rooms",
        value: null,
        isText: false,
        note: "2 large rooms",
      },
    ]);
  });

  it("returns nothing for a hall with no information", () => {
    expect(hallSections(hall())).toEqual([]);
  });

  it("places every field once", () => {
    const fields = SECTIONS.flatMap((s) => s.fields.map(([field]) => field));
    expect(new Set(fields).size).toBe(fields.length);
    expect(everyFieldPlaced).toBe(true);
  });
});

describe("extraLabel", () => {
  it("uses the extra's own label, then the site's, then the readable key", () => {
    expect(extraLabel("stage_cameras", " Stage cameras ")).toBe("Stage cameras");
    expect(extraLabel("stage_shape", null)).toBe("Stage shape");
    expect(extraLabel("stage_extension")).toBe("Stage extension");
    expect(extraLabel("rain_cover_needed", "")).toBe("Rain cover needed");
  });
});
