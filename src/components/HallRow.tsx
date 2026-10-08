/**
 * One hall in a list: its stage outline at the shared scale, name, stage size and seats.
 * Used by the home list (inside the dropdown island) and as static HTML on venue pages.
 */
import { en } from "../i18n/en";
import { meters } from "../lib/stage-plan";
import type { HallListItem } from "../lib/venue-list";

// Box for the stage outlines: the widest and deepest stages of all halls fit it, one scale for all
export const OUTLINE_WIDTH = 112;
export const OUTLINE_HEIGHT = 84;

const t = en.home;

interface Props {
  venue: string;
  hall: HallListItem;
  scale: number;
}

export default function HallRow({ venue, hall, scale }: Props) {
  const facts = [
    hall.width && hall.depth && t.stage(meters(hall.width), meters(hall.depth)),
    hall.seats && t.seats(hall.seats),
  ].filter(Boolean);

  return (
    <a
      href={`/venues/${venue}/halls/${hall.slug}/`}
      className="flex items-center gap-4 rounded p-1 text-ink no-underline hover:bg-sheet"
    >
      <StageOutline width={hall.width} depth={hall.depth} scale={scale} />
      <span>
        <span className="block font-semibold">{hall.name}</span>
        {facts.length > 0 && (
          <span className="font-stencil block text-muted">{facts.join(", ")}</span>
        )}
      </span>
    </a>
  );
}

/** The stage's width × depth at the shared scale, front edge at the bottom with a spike mark. */
function StageOutline({
  width,
  depth,
  scale,
}: {
  width: number | null;
  depth: number | null;
  scale: number;
}) {
  const boxWidth = OUTLINE_WIDTH;
  const boxHeight = OUTLINE_HEIGHT;
  if (!width || !depth || !scale) {
    return (
      <span
        aria-hidden="true"
        className="block shrink-0"
        style={{ width: boxWidth, height: boxHeight }}
      />
    );
  }
  const w = width * scale;
  const d = depth * scale;
  const x = (boxWidth - w) / 2;
  const y = boxHeight - d - 1;
  return (
    <svg
      width={boxWidth}
      height={boxHeight}
      viewBox={`0 0 ${boxWidth} ${boxHeight}`}
      className="shrink-0"
      role="img"
      aria-label={t.outline}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={d}
        fill="var(--plan-floor)"
        stroke="var(--ink)"
        strokeWidth={1.5}
      />
      <rect x={boxWidth / 2 - 3} y={boxHeight - 4.5} width={6} height={2} fill="var(--spike)" />
    </svg>
  );
}
