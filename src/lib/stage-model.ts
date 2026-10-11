/**
 * What the 3D stage view draws, in meters, from the hall's measurements (same rules as the 2D
 * plan: nothing without a stage width and depth). x = across the stage (centre line at 0),
 * y = up from the stage floor, z = from the downstage edge (0) to upstage (depth); the house
 * is at negative z.
 */
import type { HallDocument } from "./api";

export interface StageModel {
  width: number;
  depth: number;
  proscenium: number | null;
  /** Grid height above the stage floor, when known */
  grid: number | null;
  /** Batten positions (z), downstage to upstage; empty when the count or grid is unknown */
  battens: number[];
  /** True when the positions are spread evenly because only the count is recorded */
  battensEvenlySpaced: boolean;
  /** FOH position in the house (z < 0), when known */
  foh: number | null;
}

const positive = (value: number | null | undefined): number | null =>
  typeof value === "number" && value > 0 ? value : null;

/** Battens from the first pipe (or one step in) to just short of the upstage edge. */
export function battenPositions(count: number, depth: number, firstPipe: number | null): number[] {
  if (count < 1) return [];
  const first = firstPipe !== null && firstPipe < depth ? firstPipe : depth / (count + 1);
  if (count === 1) return [first];
  const last = Math.max(first, depth - Math.min(0.5, depth / (count + 1)));
  const step = (last - first) / (count - 1);
  return Array.from({ length: count }, (_, i) => Number((first + i * step).toFixed(3)));
}

/** The model, or null when the stage width or depth is unknown. */
export function stageModel(hall: HallDocument): StageModel | null {
  const width = positive(hall.stage_width_m);
  const depth = positive(hall.stage_depth_m);
  if (width === null || depth === null) return null;

  const grid = positive(hall.grid_height_m);
  const count = hall.pipe_count ?? 0;
  const battens =
    grid !== null ? battenPositions(count, depth, positive(hall.first_pipe_distance_m)) : [];
  const foh = positive(hall.foh_distance_m);

  return {
    width,
    depth,
    proscenium: positive(hall.proscenium_width_m),
    grid,
    battens,
    battensEvenlySpaced: battens.length > 1,
    foh: foh !== null ? -foh : null,
  };
}
