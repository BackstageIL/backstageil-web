/**
 * The contribution form (BSIL-58): links to it with the venue and hall filled in, the kinds of
 * submission, and API answers turned into messages a visitor understands.
 */
import { localePath, type Locale } from "../i18n";

export const KINDS = ["correction", "document", "photos", "nearby", "new_venue", "other"] as const;
export type Kind = (typeof KINDS)[number];

export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 4_000_000;

export interface SendTarget {
  kind?: Kind;
  venue?: string;
  hall?: string;
  /** Text to start the message with (e.g. the facts a hall page is missing) */
  note?: string;
}

const MAX_NOTE = 600;

/** Link to the form, e.g. /he/send/?kind=photos&venue=habima-theater&hall=rovina-hall */
export function sendPath(locale: Locale, target: SendTarget = {}): string {
  const params = new URLSearchParams();
  if (target.kind) params.set("kind", target.kind);
  if (target.venue) params.set("venue", target.venue);
  if (target.hall) params.set("hall", target.hall);
  if (target.note) params.set("note", target.note.slice(0, MAX_NOTE));
  const query = params.toString();
  return localePath(locale, "/send/") + (query ? `?${query}` : "");
}

/** The form's starting choice from the page address (unknown values are ignored). */
export function readTarget(search: string): Required<Pick<SendTarget, "kind">> & SendTarget {
  const params = new URLSearchParams(search);
  const kind = params.get("kind");
  const slug = (value: string | null) =>
    value && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) ? value : undefined;
  return {
    kind: KINDS.includes(kind as Kind) ? (kind as Kind) : "correction",
    venue: slug(params.get("venue")),
    hall: slug(params.get("hall")),
    note: params.get("note")?.slice(0, MAX_NOTE) || undefined,
  };
}

export type SendError =
  | { key: "personal" }
  | { key: "fileType"; file: string }
  | { key: "tooLarge" }
  | { key: "tooMany" }
  | { key: "filesUnavailable" }
  | { key: "invalid" }
  | { key: "network" };

/** What went wrong, from the API's status and body. */
export function sendError(status: number, body: unknown): SendError {
  const text = JSON.stringify(body ?? "");
  if (status === 413) return { key: "tooLarge" };
  if (status === 429) return { key: "tooMany" };
  if (status === 503) return { key: "filesUnavailable" };
  if (status === 422) {
    if (text.includes("phone number or email")) return { key: "personal" };
    const details = (body as { error_code?: string; details?: { file?: string } }) ?? {};
    if (details.error_code === "INVALID_SUBMISSION_FILE") {
      return { key: "fileType", file: details.details?.file ?? "" };
    }
  }
  return { key: "invalid" };
}
