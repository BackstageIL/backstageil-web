import { describe, expect, it } from "vitest";

import type { HallDocument } from "./api";
import { battenPositions, stageModel } from "./stage-model";

const hall = (fields: Partial<HallDocument>) => fields as HallDocument;

describe("stageModel", () => {
  it("is null without a stage width and depth (like the 2D plan)", () => {
    expect(stageModel(hall({ stage_width_m: 14, stage_depth_m: null }))).toBeNull();
    expect(stageModel(hall({ stage_width_m: null, stage_depth_m: 10 }))).toBeNull();
  });

  it("uses only what is known", () => {
    const model = stageModel(hall({ stage_width_m: 20.05, stage_depth_m: 12.05 }));
    expect(model).toEqual({
      width: 20.05,
      depth: 12.05,
      proscenium: null,
      grid: null,
      battens: [],
      battensEvenlySpaced: false,
      foh: null,
    });
  });

  it("places battens only when the grid height is known, and puts FOH in the house", () => {
    const model = stageModel(
      hall({
        stage_width_m: 20,
        stage_depth_m: 12,
        grid_height_m: 13.9,
        pipe_count: 12,
        foh_distance_m: 20,
      }),
    );
    expect(model?.battens).toHaveLength(12);
    expect(model?.battensEvenlySpaced).toBe(true);
    expect(model?.foh).toBe(-20);
    expect(
      stageModel(hall({ stage_width_m: 20, stage_depth_m: 12, pipe_count: 12 }))?.battens,
    ).toEqual([]);
  });
});

describe("battenPositions", () => {
  it("starts at the first pipe and stays on the stage, evenly spaced", () => {
    const positions = battenPositions(4, 10, 1);
    expect(positions[0]).toBe(1);
    expect(positions.at(-1)).toBeLessThan(10);
    const steps = positions.slice(1).map((z, i) => z - positions[i]);
    expect(Math.max(...steps) - Math.min(...steps)).toBeLessThan(0.002);
  });

  it("handles none, one and a first pipe beyond the stage", () => {
    expect(battenPositions(0, 10, null)).toEqual([]);
    expect(battenPositions(1, 10, 2)).toEqual([2]);
    expect(battenPositions(3, 8, 20)[0]).toBe(2);
  });
});
