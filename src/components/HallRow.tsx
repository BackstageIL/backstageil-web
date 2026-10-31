/**
 * One hall in a list: its stage outline at the shared scale, name, stage size and seats.
 * Used by the home list (inside the dropdown island) and as static HTML on venue pages.
 */
import { localePath, strings, type Locale } from "../i18n";
import { meters } from "../lib/stage-plan";
import type { HallListItem } from "../lib/venue-list";

// Box for the stage outlines: the widest and deepest stages of all halls fit it, one scale for all
export const OUTLINE_WIDTH = 112;
export const OUTLINE_HEIGHT = 84;
// Room around the stages so the biggest one's border isn't cut by the box edge (BSIL-73)
const OUTLINE_PAD = 3;
/** The area the shared scale fits the stages into: the box minus its padding */
export const OUTLINE_INNER_WIDTH = OUTLINE_WIDTH - 2 * OUTLINE_PAD;
export const OUTLINE_INNER_HEIGHT = OUTLINE_HEIGHT - 2 * OUTLINE_PAD;

interface Props {
  venue: string;
  hall: HallListItem;
  scale: number;
  locale: Locale;
}

export default function HallRow({ venue, hall, scale, locale }: Props) {
  const dictionary = strings(locale);
  const t = dictionary.home;
  const unit = dictionary.units.meters;
  const facts = [
    hall.width && hall.depth && t.stage(meters(hall.width, unit), meters(hall.depth, unit)),
    hall.seats && t.seats(hall.seats),
  ].filter(Boolean);

  return (
    <a
      href={localePath(locale, `/venues/${venue}/halls/${hall.slug}/`)}
      className="flex items-center gap-4 rounded p-1 text-ink no-underline hover:bg-sheet"
    >
      <StageOutline width={hall.width} depth={hall.depth} scale={scale} label={t.outline} />
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
  label,
}: {
  width: number | null;
  depth: number | null;
  scale: number;
  label: string;
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
  const y = boxHeight - OUTLINE_PAD - d;
  return (
    <svg
      width={boxWidth}
      height={boxHeight}
      viewBox={`0 0 ${boxWidth} ${boxHeight}`}
      className="shrink-0"
      role="img"
      aria-label={label}
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
      <rect
        x={boxWidth / 2 - 3}
        y={boxHeight - OUTLINE_PAD - 3.5}
        width={6}
        height={2}
        fill="var(--spike)"
      />
    </svg>
  );
}
