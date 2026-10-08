/**
 * Geometry of a hall's stage plan, in meters, drawn to scale from the API's measurements.
 * Top view: upstage at the top, the proscenium line at the stage's front edge, the house below.
 */
import type { HallDocument } from "./api";

export interface StagePlan {
  width: number;
  depth: number;
  proscenium: number | null;
  firstPipe: number | null;
  foh: number | null;
  /** Where the proscenium wall ends on each side: past the stage, so it reads as a wall. */
  wallEnd: number;
  /** SVG viewBox around the drawing, with room for dimension labels. */
  viewBox: { x: number; y: number; width: number; height: number };
  /** Text size in drawing units, proportional to the drawing so it reads the same at any size. */
  text: number;
}

const positive = (value: number | null | undefined): number | null =>
  typeof value === "number" && value > 0 ? value : null;

/** The plan, or null when the stage width or depth is unknown. */
export function stagePlan(hall: HallDocument): StagePlan | null {
  const width = positive(hall.stage_width_m);
  const depth = positive(hall.stage_depth_m);
  if (width === null || depth === null) return null;

  const proscenium = positive(hall.proscenium_width_m);
  const firstPipe = positive(hall.first_pipe_distance_m);
  const firstPipeShown = firstPipe !== null && firstPipe < depth ? firstPipe : null;
  const foh = positive(hall.foh_distance_m);

  const size = Math.max(width, depth + (foh ?? 0));
  const text = size / 26;
  const wallEnd = Math.max(width, proscenium ?? 0) / 2 + text * 1.5;
  const margin = text * 3.2;
  const houseDepth = foh !== null ? foh + text * 3.5 : text * 4;

  return {
    width,
    depth,
    proscenium,
    firstPipe: firstPipeShown,
    foh,
    wallEnd,
    viewBox: {
      x: -wallEnd - margin,
      y: -margin,
      width: 2 * (wallEnd + margin),
      height: margin + depth + houseDepth,
    },
    text,
  };
}

/** Whole meters from 1 to the stage size, for the 1 m floor grid. */
export function gridLines(length: number): number[] {
  return Array.from({ length: Math.max(0, Math.ceil(length) - 1) }, (_, i) => i + 1);
}

/** A readable length: "14 m", "12.5 m". */
export function meters(value: number): string {
  return `${Number(value.toFixed(2))} m`;
}
