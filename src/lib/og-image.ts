/**
 * Link preview pictures (BSIL-59): the 1200 × 630 card WhatsApp, Facebook and others show when a
 * page is shared. Drawn at build time as SVG (this file, no rendering) and turned into PNG by
 * `og-render.ts`. Hall and venue cards show the stage plan to scale next to the facts; Hebrew
 * cards put the text on the right and the plan on the left (the drawing itself is never mirrored).
 */
import { cityName, nameIn, streetAddress, strings, type Locale } from "../i18n";
import type { HallDocument, VenueDetail } from "./api";
import { gridLines, meters, stagePlan, type PlanInput, type StagePlan } from "./stage-plan";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** The site's dark theme ("backstage running lights"), as in `global.css`. */
const COLORS = {
  paper: "#0e1626",
  sheet: "#16213a",
  ink: "#e6ebf5",
  muted: "#9aa6bd",
  rule: "#2a3754",
  cue: "#8fb0ff",
  spike: "#f5c518",
  floor: "#1d2a47",
};

/** The fonts in `og-fonts/`: the site's heading font, its text font, and Heebo for Hebrew. */
export type FontRole = "display" | "text";
export interface Font {
  family: string;
  weight: number;
}

const HEBREW = /[֐-׿]/;

export function fontFor(role: FontRole, text: string): Font {
  if (HEBREW.test(text)) return { family: "Heebo", weight: role === "display" ? 700 : 400 };
  return role === "display"
    ? { family: "Archivo", weight: 700 }
    : { family: "Atkinson Hyperlegible Next", weight: 400 };
}

/** Width in pixels of `text` set in `font` at `size` (measured by the renderer). */
export type Measure = (text: string, font: Font, size: number) => number;

export interface Fact {
  label: string;
  value: string;
}

export interface HallRow {
  name: string;
  size: string | null;
  seats: string | null;
}

export interface Card {
  locale: Locale;
  /** The site's own card: a large title, without the small name above it */
  site?: boolean;
  title: string;
  subtitle?: string | null;
  place?: string | null;
  facts?: Fact[];
  rows?: HallRow[];
  /** "and 2 more", for halls that don't fit */
  more?: (count: number) => string;
  plan?: { input: PlanInput; caption?: string | null } | null;
  /** The picture's description (`og:image:alt`) */
  alt: string;
}

/** Where a page's preview picture is published. */
export function ogImagePath(locale: Locale, target: { venue?: string; hall?: string } = {}) {
  if (!target.venue) return `/og/${locale}/site.png`;
  if (!target.hall) return `/og/${locale}/venues/${target.venue}.png`;
  return `/og/${locale}/venues/${target.venue}/halls/${target.hall}.png`;
}

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Splits `text` into at most `maxLines` lines no wider than `maxWidth`, trying sizes from `sizes[0]`
 * down to `sizes[1]`; at the smallest size the last line is cut with an ellipsis if needed.
 */
export function fitText(
  text: string,
  font: Font,
  maxWidth: number,
  sizes: [number, number],
  maxLines: number,
  measure: Measure,
): { size: number; lines: string[] } {
  if (!text.trim()) return { size: sizes[0], lines: [""] };
  const wrap = (size: number) => {
    const lines: string[] = [];
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const last = lines.at(-1);
      if (last !== undefined && measure(`${last} ${word}`, font, size) <= maxWidth) {
        lines[lines.length - 1] = `${last} ${word}`;
      } else {
        lines.push(word);
      }
    }
    return lines;
  };
  const [largest, smallest] = sizes;
  for (let size = largest; size > smallest; size -= 4) {
    const lines = wrap(size);
    if (lines.length <= maxLines && lines.every((line) => measure(line, font, size) <= maxWidth)) {
      return { size, lines };
    }
  }
  const lines = wrap(smallest);
  const kept = lines.slice(0, maxLines);
  const overflows = lines.length > maxLines;
  // The last line holds the rest of the text, cut to fit
  let last = lines.slice(kept.length - 1).join(" ");
  if (overflows || measure(last, font, smallest) > maxWidth) {
    while (last.length > 1 && measure(`${last}…`, font, smallest) > maxWidth) {
      last = last.slice(0, -1).trimEnd();
    }
    last = `${last}…`;
  }
  kept[kept.length - 1] = last;
  return { size: smallest, lines: kept };
}

interface TextOptions {
  x: number;
  y: number;
  size: number;
  font: Font;
  fill: string;
  rtl: boolean;
  anchor?: "start" | "middle" | "end";
  transform?: string;
}

/** Starts right-to-left text, so a line that begins with a number still reads in Hebrew order. */
const RLM = "\u200f";

/**
 * One line of text. `anchor` is visual: "start" puts the text right of x, "end" left of it.
 * Right-to-left lines line up on the right edge by default.
 */
function text(content: string, o: TextOptions): string {
  const anchor = o.anchor ?? (o.rtl ? "end" : "start");
  const direction = o.rtl ? ' direction="rtl"' : "";
  const transform = o.transform ? ` transform="${o.transform}"` : "";
  return `<text x="${round(o.x)}" y="${round(o.y)}" font-family="${o.font.family}" font-weight="${o.font.weight}" font-size="${round(o.size)}" fill="${o.fill}" text-anchor="${anchor}"${direction}${transform}>${o.rtl ? RLM : ""}${escape(content)}</text>`;
}

const round = (value: number) => Number(value.toFixed(2));

/** The plan's drawing, in meters, for a link preview (no FOH: the stage stays large). */
function planDrawing(plan: StagePlan, locale: Locale): string {
  const t = strings(locale);
  const s = plan.text;
  const half = plan.width / 2;
  const rtl = locale === "he";
  const label = (content: string, x: number, y: number, extra: Partial<TextOptions> = {}) =>
    text(content, {
      x,
      y,
      size: s,
      font: fontFor("display", content),
      fill: COLORS.ink,
      rtl,
      anchor: "middle",
      ...extra,
    });
  const unit = (value: number) => meters(value, t.units.meters);
  const line = (x1: number, y1: number, x2: number, y2: number, style: string) =>
    `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ${style}/>`;
  const thin = `stroke="${COLORS.muted}" stroke-width="${round(s * 0.06)}"`;
  const depthX = -plan.wallEnd - s;

  return [
    `<rect x="${-half}" y="0" width="${plan.width}" height="${plan.depth}" fill="${COLORS.floor}"/>`,
    ...gridLines(plan.width).map((x) =>
      line(
        -half + x,
        0,
        -half + x,
        plan.depth,
        `stroke="${COLORS.rule}" stroke-width="${round(s * 0.04)}"`,
      ),
    ),
    ...gridLines(plan.depth).map((y) =>
      line(-half, y, half, y, `stroke="${COLORS.rule}" stroke-width="${round(s * 0.04)}"`),
    ),
    `<rect x="${-half}" y="0" width="${plan.width}" height="${plan.depth}" fill="none" stroke="${COLORS.ink}" stroke-width="${round(s * 0.12)}"/>`,
    line(0, 0, 0, plan.depth, `${thin} stroke-dasharray="${round(s * 0.6)} ${round(s * 0.3)}"`),
    `<rect x="${round(-s * 0.5)}" y="${round(plan.depth - s * 1.1)}" width="${round(s)}" height="${round(s * 0.4)}" fill="${COLORS.spike}"/>`,
    plan.firstPipe
      ? line(
          -half,
          plan.depth - plan.firstPipe,
          half,
          plan.depth - plan.firstPipe,
          `stroke="${COLORS.cue}" stroke-width="${round(s * 0.1)}" stroke-dasharray="${round(s * 0.5)} ${round(s * 0.25)}"`,
        )
      : "",
    plan.proscenium
      ? [
          line(
            -plan.wallEnd,
            plan.depth,
            -plan.proscenium / 2,
            plan.depth,
            `stroke="${COLORS.ink}" stroke-width="${round(s * 0.45)}"`,
          ),
          line(
            plan.proscenium / 2,
            plan.depth,
            plan.wallEnd,
            plan.depth,
            `stroke="${COLORS.ink}" stroke-width="${round(s * 0.45)}"`,
          ),
        ].join("")
      : "",
    label(t.hall.upstage, 0, s * 1.6, { fill: COLORS.muted }),
    // Width on top, depth on the left
    line(-half, -s, half, -s, thin),
    line(-half, -s * 1.5, -half, -s * 0.5, thin),
    line(half, -s * 1.5, half, -s * 0.5, thin),
    label(unit(plan.width), 0, -s * 1.5),
    line(depthX, 0, depthX, plan.depth, thin),
    line(depthX - s * 0.5, 0, depthX + s * 0.5, 0, thin),
    line(depthX - s * 0.5, plan.depth, depthX + s * 0.5, plan.depth, thin),
    label(unit(plan.depth), depthX - s * 0.5, plan.depth / 2, {
      transform: `rotate(-90 ${round(depthX - s * 0.5)} ${round(plan.depth / 2)})`,
    }),
    label(t.hall.house, 0, plan.depth + s * 3, { fill: COLORS.muted }),
  ].join("");
}

const MARGIN = 64;
const PANEL_WIDTH = 488;
const BOTTOM = 546; // baseline of the lowest line of text
const ROW = 44;
const MAX_ROWS = 3;

/** The card as an SVG document. */
export function cardSvg(card: Card, measure: Measure): string {
  const rtl = card.locale === "he";
  const t = strings(card.locale);
  const plan = card.plan ? stagePlan({ ...card.plan.input, foh_distance_m: null }, 1.6) : null;

  // Text column (and the plan panel on the other side, when there is a plan)
  const columnWidth = plan ? OG_WIDTH - 2 * MARGIN - PANEL_WIDTH - 24 : OG_WIDTH - 2 * MARGIN;
  const edge = rtl ? OG_WIDTH - MARGIN : MARGIN;
  const along = (offset: number) => (rtl ? edge - offset : edge + offset);
  const far = rtl ? "start" : "end"; // anchor for text that ends at the far side of the column
  const write = (
    content: string,
    x: number,
    y: number,
    size: number,
    font: Font,
    fill: string,
    anchor?: "start" | "end",
  ) => text(content, { x, y, size, font, fill, rtl, anchor });
  const parts: string[] = [
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${COLORS.paper}"/>`,
    // The site's name, after a spike-tape mark
    `<rect x="${rtl ? edge - 36 : edge}" y="70" width="36" height="10" fill="${COLORS.spike}"/>`,
  ];
  if (!card.site) {
    parts.push(
      text(t.site.name, {
        x: along(50),
        y: 86,
        size: 30,
        font: fontFor("display", t.site.name),
        fill: COLORS.ink,
        rtl: false,
        anchor: rtl ? "end" : "start",
      }),
    );
  }

  // Title (up to 2 lines), subtitle (up to 2), place (1); `y` is the last baseline written
  const titleFont = fontFor("display", card.title);
  const title = fitText(
    card.title,
    titleFont,
    columnWidth,
    card.site ? [140, 60] : [76, 44],
    2,
    measure,
  );
  let y = 150 + title.size * 0.85;
  title.lines.forEach((line, i) => {
    if (i > 0) y += title.size * 1.1;
    parts.push(write(line, edge, y, title.size, titleFont, COLORS.ink));
  });
  y += title.size * 0.2; // room for the title's descenders
  if (card.subtitle) {
    const font = fontFor("text", card.subtitle);
    const fitted = fitText(card.subtitle, font, columnWidth, [40, 32], 2, measure);
    for (const line of fitted.lines) {
      y += fitted.size * 1.35;
      parts.push(write(line, edge, y, fitted.size, font, COLORS.ink));
    }
  }
  if (card.place) {
    const font = fontFor("text", card.place);
    const fitted = fitText(card.place, font, columnWidth, [28, 24], 1, measure);
    y += 44;
    parts.push(write(fitted.lines[0], edge, y, fitted.size, font, COLORS.muted));
  }

  // Facts in columns along the bottom (halls): a third of the column each, wider when needed
  const facts = card.facts ?? [];
  const step = columnWidth / Math.max(3, facts.length);
  let offset = 0;
  facts.forEach((fact, i) => {
    const x = along(offset);
    const width = Math.max(
      measure(fact.label, fontFor("text", fact.label), 24),
      measure(fact.value, fontFor("display", fact.value), 40),
    );
    offset = Math.max((i + 1) * step, offset + width + 32);
    parts.push(
      write(fact.label, x, BOTTOM - 46, 24, fontFor("text", fact.label), COLORS.muted),
      write(fact.value, x, BOTTOM, 40, fontFor("display", fact.value), COLORS.ink),
    );
  });

  // A short list of halls (venues), down to the bottom; what doesn't fit is counted
  const rows = card.rows ?? [];
  let shown = Math.min(rows.length, MAX_ROWS);
  const lines = () => shown + (rows.length > shown ? 1 : 0);
  const firstRow = () => Math.max(y + 64, BOTTOM - (lines() - 1) * ROW);
  while (shown > 1 && firstRow() + (lines() - 1) * ROW > BOTTOM) shown -= 1;
  rows.slice(0, shown).forEach((row, i) => {
    const rowY = firstRow() + i * ROW;
    // Seats at the far side, the stage size before them, the name in the room that's left
    let used = 0;
    if (row.seats) {
      const font = fontFor("text", row.seats);
      parts.push(write(row.seats, along(columnWidth), rowY, 26, font, COLORS.muted, far));
      used += measure(row.seats, font, 26) + 28;
    }
    if (row.size) {
      const font = fontFor("display", row.size);
      parts.push(write(row.size, along(columnWidth - used), rowY, 28, font, COLORS.ink, far));
      used += measure(row.size, font, 28) + 28;
    }
    const nameFont = fontFor("text", row.name);
    const name = fitText(row.name, nameFont, columnWidth - used, [28, 22], 1, measure);
    parts.push(
      `<line x1="${edge}" y1="${round(rowY - 32)}" x2="${along(columnWidth)}" y2="${round(rowY - 32)}" stroke="${COLORS.rule}" stroke-width="1"/>`,
      write(name.lines[0], edge, rowY, name.size, nameFont, COLORS.ink),
    );
  });
  if (rows.length > shown && card.more) {
    const more = card.more(rows.length - shown);
    parts.push(
      write(more, edge, firstRow() + shown * ROW, 24, fontFor("text", more), COLORS.muted),
    );
  }

  // The plan, to scale, in a panel on the other side
  if (plan && card.plan) {
    const panelX = rtl ? MARGIN : OG_WIDTH - MARGIN - PANEL_WIDTH;
    const panelHeight = OG_HEIGHT - 2 * MARGIN;
    const caption = card.plan.caption ?? null;
    const box = plan.viewBox;
    parts.push(
      `<rect x="${panelX}" y="${MARGIN}" width="${PANEL_WIDTH}" height="${panelHeight}" rx="16" fill="${COLORS.sheet}" stroke="${COLORS.rule}" stroke-width="2"/>`,
      `<svg x="${panelX + 16}" y="${MARGIN + 16}" width="${PANEL_WIDTH - 32}" height="${panelHeight - 32 - (caption ? 40 : 0)}" viewBox="${round(box.x)} ${round(box.y)} ${round(box.width)} ${round(box.height)}" preserveAspectRatio="xMidYMid meet">${planDrawing(plan, card.locale)}</svg>`,
    );
    if (caption) {
      const font = fontFor("text", caption);
      const fitted = fitText(caption, font, PANEL_WIDTH - 48, [24, 20], 1, measure);
      parts.push(
        text(fitted.lines[0], {
          x: panelX + PANEL_WIDTH / 2,
          y: MARGIN + panelHeight - 24,
          size: fitted.size,
          font,
          fill: COLORS.muted,
          rtl,
          anchor: "middle",
        }),
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">${parts.join("")}</svg>`;
}

const sizeOf = (
  locale: Locale,
  hall: { stage_width_m?: number | null; stage_depth_m?: number | null },
): string | null => {
  const t = strings(locale);
  if (!hall.stage_width_m || !hall.stage_depth_m) return null;
  return t.og.size(
    String(Number(hall.stage_width_m.toFixed(2))),
    meters(hall.stage_depth_m, t.units.meters),
  );
};

/** A hall page's card: venue and hall names, city, stage size, proscenium, seats, the plan. */
export function hallCard(locale: Locale, hall: HallDocument): Card {
  const t = strings(locale);
  const facts: Fact[] = [];
  const size = sizeOf(locale, hall);
  if (size) facts.push({ label: t.og.stage, value: size });
  if (hall.proscenium_width_m) {
    facts.push({ label: t.og.proscenium, value: meters(hall.proscenium_width_m, t.units.meters) });
  }
  if (hall.capacity_seated) {
    facts.push({ label: t.og.seats, value: hall.capacity_seated.toLocaleString(t.locale.intl) });
  }
  const title = nameIn(locale, hall.venue);
  const subtitle = nameIn(locale, hall);
  const plan = size ? stagePlan(hall) : null;
  const unit = (value: number) => meters(value, t.units.meters);
  return {
    locale,
    title,
    subtitle,
    place: cityName(locale, hall.venue.city),
    facts,
    plan: size ? { input: hall } : null,
    alt: t.og.alt(
      `${subtitle}, ${title}`,
      plan ? t.hall.planStage(unit(plan.width), unit(plan.depth)) : null,
    ),
  };
}

/** A venue page's card: name, address, its halls, and the plan of the largest stage. */
export function venueCard(locale: Locale, venue: VenueDetail): Card {
  const t = strings(locale);
  const street = streetAddress(locale, venue);
  const city = cityName(locale, venue.city);
  const title = nameIn(locale, venue);
  const place = street ? `${street}, ${city}` : city;
  const area = (hall: VenueDetail["halls"][number]) =>
    (hall.stage_width_m ?? 0) * (hall.stage_depth_m ?? 0);
  const largest = [...venue.halls].sort((a, b) => area(b) - area(a))[0];
  return {
    locale,
    title,
    place,
    rows: venue.halls.map((hall) => ({
      name: nameIn(locale, hall),
      size: sizeOf(locale, hall),
      seats: hall.capacity_seated ? t.og.hallSeats(hall.capacity_seated) : null,
    })),
    more: t.og.moreHalls,
    plan:
      largest && area(largest) > 0
        ? {
            input: largest,
            caption: venue.halls.length > 1 ? t.og.planOf(nameIn(locale, largest)) : null,
          }
        : null,
    alt: t.og.alt(title, place),
  };
}

/** The card for every other page: the site's name, what it is, and how much is in it. */
export function siteCard(locale: Locale, venues: number, halls: number): Card {
  const t = strings(locale);
  return {
    locale,
    site: true,
    title: t.site.name,
    subtitle: t.site.tagline,
    facts: [
      { label: t.og.venues, value: venues.toLocaleString(t.locale.intl) },
      { label: t.og.halls, value: halls.toLocaleString(t.locale.intl) },
    ],
    alt: t.og.alt(t.site.name, t.site.tagline.replace(/\.$/, "")),
  };
}
