import { describe, expect, it } from "vitest";

import type { HallDocument } from "./api";
import { gridLines, meters, stagePlan } from "./stage-plan";

const hall = (fields: Partial<HallDocument>) => fields as HallDocument;

describe("stagePlan", () => {
  it("needs both stage width and depth", () => {
    expect(stagePlan(hall({ stage_width_m: 14 }))).toBeNull();
    expect(stagePlan(hall({ stage_depth_m: 11 }))).toBeNull();
    expect(stagePlan(hall({ stage_width_m: 0, stage_depth_m: 11 }))).toBeNull();
  });

  it("draws the measurements it has", () => {
    const plan = stagePlan(
      hall({
        stage_width_m: 14,
        stage_depth_m: 11,
        proscenium_width_m: 12,
        first_pipe_distance_m: 1.2,
        foh_distance_m: 12,
      }),
    );

    expect(plan).toMatchObject({ width: 14, depth: 11, proscenium: 12, firstPipe: 1.2, foh: 12 });
    expect(plan?.wallEnd).toBeGreaterThan(7); // the proscenium wall reaches past the stage
  });

  it("leaves out a first pipe that is not on the stage", () => {
    const plan = stagePlan(hall({ stage_width_m: 10, stage_depth_m: 8, first_pipe_distance_m: 9 }));
    expect(plan?.firstPipe).toBeNull();
  });

  it("makes room for the house when the FOH distance is known", () => {
    const base = { stage_width_m: 14, stage_depth_m: 11 };
    const without = stagePlan(hall(base));
    const withFoh = stagePlan(hall({ ...base, foh_distance_m: 20 }));

    if (!without || !withFoh) throw new Error("both plans should exist");
    expect(withFoh.viewBox.height).toBeGreaterThan(without.viewBox.height + 15);
    expect(withFoh.viewBox.x).toBeLessThan(-7);
    expect(withFoh.viewBox.width).toBeGreaterThan(14);
  });
});

describe("helpers", () => {
  it("lists the inner whole-meter grid lines", () => {
    expect(gridLines(4)).toEqual([1, 2, 3]);
    expect(gridLines(3.5)).toEqual([1, 2, 3]);
    expect(gridLines(1)).toEqual([]);
  });

  it("formats meters", () => {
    expect(meters(14)).toBe("14 m");
    expect(meters(12.5)).toBe("12.5 m");
    expect(meters(1.234)).toBe("1.23 m");
  });
});
