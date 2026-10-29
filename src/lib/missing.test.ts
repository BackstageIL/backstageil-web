import { describe, expect, it } from "vitest";

import { strings } from "../i18n";
import type { HallDocument } from "./api";
import { missingFacts, missingTemplate } from "./missing";

const hall = (fields: Partial<HallDocument>) => fields as HallDocument;

describe("missingFacts", () => {
  it("lists every key fact for an empty hall, in planning order", () => {
    const missing = missingFacts(hall({ power_circuits_a: [] }), strings("en"));
    expect(missing.all).toBe(true);
    expect(missing.labels[0]).toBe("Stage size (width × depth)");
    expect(missing.labels).toHaveLength(7);
  });

  it("leaves out what is known; an empty list of circuits counts as unknown", () => {
    const missing = missingFacts(
      hall({ stage_width_m: 14, stage_depth_m: 10, capacity_seated: 500, power_circuits_a: [] }),
      strings("he"),
    );
    expect(missing.all).toBe(false);
    expect(missing.labels).not.toContain("מקומות ישיבה");
    expect(missing.labels).not.toContain("מידות הבמה (רוחב × עומק)");
    expect(missing.labels).toContain("מעגלי חשמל");
  });

  it("needs both stage width and depth for the stage size", () => {
    expect(missingFacts(hall({ stage_width_m: 14 }), strings("en")).labels).toContain(
      "Stage size (width × depth)",
    );
  });

  it("counts a zero as known, and blank text as unknown", () => {
    const labels = missingFacts(
      hall({ dressing_rooms: 0, load_in_notes: "  " }),
      strings("en"),
    ).labels;
    expect(labels).not.toContain(strings("en").fields.dressing_rooms);
    expect(labels).toContain(strings("en").fields.load_in_notes);
  });

  it("is empty when every key fact is known", () => {
    const full = hall({
      stage_width_m: 20,
      stage_depth_m: 12,
      proscenium_width_m: 14,
      capacity_seated: 900,
      grid_height_m: 19,
      power_circuits_a: [{ amps: 63 }] as never,
      load_in_notes: "Dock at the back",
      dressing_rooms: 4,
    });
    expect(missingFacts(full, strings("en")).labels).toEqual([]);
  });
});

describe("missingTemplate", () => {
  it("gives one line to fill in per missing fact", () => {
    expect(missingTemplate({ labels: ["Grid height", "Power"], all: false })).toBe(
      "Grid height: \nPower: ",
    );
  });
});
