/**
 * How a hall's technical document is shown: which section each API field belongs to, and how
 * its value is formatted. Every technical field of the API's HallDocument must be placed here;
 * a new API column fails the type check until it is.
 */
import { en } from "../i18n/en";
import type { HallDocument } from "./api";

export type Kind = "count" | "meters" | "kg" | "amps" | "bool" | "allowed" | "enum" | "text";

type Meta = "slug" | "name" | "venue" | "field_notes" | "extras" | "source" | "last_verified_at";
export type TechnicalField = Exclude<keyof HallDocument, Meta>;

export interface Section {
  id: keyof typeof en.sections;
  fields: readonly (readonly [TechnicalField, Kind])[];
}

export const SECTIONS = [
  {
    id: "general",
    fields: [
      ["capacity_seated", "count"],
      ["capacity_standing", "count"],
    ],
  },
  {
    id: "access",
    fields: [
      ["load_in_notes", "text"],
      ["case_storage", "bool"],
    ],
  },
  {
    id: "stage",
    fields: [
      ["stage_width_m", "meters"],
      ["stage_depth_m", "meters"],
      ["proscenium_width_m", "meters"],
      ["stage_floor", "enum"],
      ["has_orchestra_pit", "bool"],
      ["has_stairs_to_house", "bool"],
      ["has_quick_change_area", "bool"],
    ],
  },
  {
    id: "rigging",
    fields: [
      ["grid_height_m", "meters"],
      ["pipe_count", "count"],
      ["pipe_type", "enum"],
      ["pipe_load_kg", "kg"],
      ["first_pipe_distance_m", "meters"],
      ["foh_truss_possible", "bool"],
      ["has_lighting_bridge", "bool"],
      ["pa_flying_possible", "bool"],
      ["truss_hanging_possible", "bool"],
    ],
  },
  {
    id: "masking",
    fields: [
      ["has_masking", "bool"],
      ["has_black_legs", "bool"],
    ],
  },
  {
    id: "power",
    fields: [
      ["power_circuits_a", "amps"],
      ["has_backup_generator", "bool"],
    ],
  },
  {
    id: "sound",
    fields: [
      ["house_pa", "text"],
      ["foh_position", "text"],
      ["foh_distance_m", "meters"],
    ],
  },
  {
    id: "lighting",
    fields: [
      ["follow_spot_positions", "count"],
      ["has_video_space", "bool"],
    ],
  },
  {
    id: "backstage",
    fields: [
      ["dressing_rooms", "count"],
      ["star_dressing_rooms", "count"],
      ["has_green_room", "bool"],
      ["has_showers", "bool"],
      ["has_artist_toilets", "bool"],
      ["has_production_office", "bool"],
      ["has_laundry", "bool"],
      ["has_wifi", "bool"],
    ],
  },
  {
    id: "rules",
    fields: [
      ["haze_allowed", "allowed"],
      ["stage_screws_allowed", "allowed"],
    ],
  },
  {
    id: "seating",
    fields: [
      ["seat_kills", "text"],
      ["sightlines", "text"],
    ],
  },
  {
    id: "notes",
    fields: [
      ["notes", "text"],
      ["known_issues", "text"],
    ],
  },
] as const satisfies readonly Section[];

// Compile-time check: every technical field of the API is placed in a section.
type Placed = (typeof SECTIONS)[number]["fields"][number][0];
type Unplaced = Exclude<TechnicalField, Placed>;
export const everyFieldPlaced: [Unplaced] extends [never] ? true : Unplaced = true;

const number = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

/** The value as shown on the page, or null when the venue hasn't given it. */
export function formatValue(field: TechnicalField, kind: Kind, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  switch (kind) {
    case "count":
      return number.format(value as number);
    case "meters":
      return `${number.format(value as number)} m`;
    case "kg":
      return `${number.format(value as number)} kg`;
    case "amps": {
      const circuits = value as number[];
      return circuits.length ? circuits.map((amps) => `${amps} A`).join(", ") : null;
    }
    case "bool":
      return value ? en.values.yes : en.values.no;
    case "allowed":
      return value ? en.values.allowed : en.values.notAllowed;
    case "enum": {
      const labels = en.values[field as "stage_floor" | "pipe_type"] as Record<string, string>;
      return labels[value as string] ?? String(value);
    }
    case "text": {
      const text = String(value).trim();
      return text || null;
    }
  }
}

export interface Row {
  field: TechnicalField;
  label: string;
  value: string | null;
  /** Free text reads as a sentence under the label; short values sit beside it. */
  isText: boolean;
  note: string | null;
}

export interface FilledSection {
  id: Section["id"];
  title: string;
  rows: Row[];
}

/** Sections with the rows the venue has filled in (a value or a note); empty sections are left out. */
export function hallSections(hall: HallDocument): FilledSection[] {
  const notes = hall.field_notes ?? {};
  return SECTIONS.map((section) => ({
    id: section.id,
    title: en.sections[section.id],
    rows: section.fields
      .map(([field, kind]): Row => {
        const note = notes[field]?.trim() || null;
        return {
          field,
          label: en.fields[field],
          value: formatValue(field, kind, hall[field]),
          isText: kind === "text",
          note,
        };
      })
      .filter((row) => row.value !== null || row.note !== null),
  })).filter((section) => section.rows.length > 0);
}

/** Label of a hall extra: its own, the site's for registered keys, or the key made readable. */
export function extraLabel(key: string, label?: string | null): string {
  if (label?.trim()) return label.trim();
  const known = en.extras[key];
  if (known) return known;
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
