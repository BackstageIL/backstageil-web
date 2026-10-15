/**
 * The key facts a hall page is still missing (BSIL-61), so a visitor who knows the hall can send
 * them. The form opens with one line per missing fact, ready to fill in.
 */
import type { Strings } from "../i18n";
import type { HallDocument } from "./api";

type Field = keyof Strings["fields"];

/** Known: a value, or a list with something in it (power circuits are a list). */
const has = (value: unknown) => (Array.isArray(value) ? value.length > 0 : Boolean(value));

/** The facts crews ask for first, in the order they plan a load-in. */
const KEY_FACTS: { key: Field | "stage_size"; known: (hall: HallDocument) => boolean }[] = [
  { key: "stage_size", known: (h) => has(h.stage_width_m) && has(h.stage_depth_m) },
  { key: "proscenium_width_m", known: (h) => has(h.proscenium_width_m) },
  { key: "capacity_seated", known: (h) => has(h.capacity_seated) },
  { key: "grid_height_m", known: (h) => has(h.grid_height_m) },
  { key: "power_circuits_a", known: (h) => has(h.power_circuits_a) },
  { key: "load_in_notes", known: (h) => has(h.load_in_notes) },
  { key: "dressing_rooms", known: (h) => has(h.dressing_rooms) },
];

export interface Missing {
  /** Labels of the facts still unknown, in planning order */
  labels: string[];
  /** Nothing at all is known yet */
  all: boolean;
}

export function missingFacts(hall: HallDocument, dictionary: Strings): Missing {
  const unknown = KEY_FACTS.filter((fact) => !fact.known(hall));
  return {
    labels: unknown.map((fact) =>
      fact.key === "stage_size" ? dictionary.hall.missing.stageSize : dictionary.fields[fact.key],
    ),
    all: unknown.length === KEY_FACTS.length,
  };
}

/** The form's message, one "label: " line per missing fact. */
export function missingTemplate(missing: Missing): string {
  return missing.labels.map((label) => `${label}: `).join("\n");
}
