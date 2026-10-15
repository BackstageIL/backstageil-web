/**
 * The contribution form (BSIL-58). Posts to the API from the browser; nothing is published until
 * the admin reviews it. Photos are shrunk in the browser (which also drops their location data)
 * so more fit in the 4 MB limit. A hidden field and the time the form was opened catch bots.
 */
import { useEffect, useMemo, useState, type SubmitEvent } from "react";

import type { Strings } from "../i18n/en";
import {
  KINDS,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  readTarget,
  sendError,
  type Kind,
  type SendError,
} from "../lib/send";

export interface SendVenue {
  slug: string;
  name: string;
  halls: { slug: string; name: string }[];
}

type SendStrings = Strings["send"];

/**
 * The form's texts as plain strings: data passed to a browser component can't hold functions, so
 * texts with a value carry a "{value}" placeholder instead (see `sendTexts`).
 */
export type SendTexts = Omit<SendStrings, "filesTotal" | "removeFile" | "errors"> & {
  filesTotal: string;
  removeFile: string;
  errors: Omit<SendStrings["errors"], "fileType" | "tooLarge" | "filesUnavailable"> & {
    fileType: string;
    tooLarge: string;
    filesUnavailable: string;
  };
};

const PLACEHOLDER = "{value}";

/** Plain-string texts for the form, with the contact address already filled in. */
export function sendTexts(t: SendStrings, email: string): SendTexts {
  return {
    ...t,
    filesTotal: t.filesTotal(PLACEHOLDER),
    removeFile: t.removeFile(PLACEHOLDER),
    errors: {
      ...t.errors,
      fileType: t.errors.fileType(PLACEHOLDER),
      tooLarge: t.errors.tooLarge(email),
      filesUnavailable: t.errors.filesUnavailable(email),
    },
  };
}

const fill = (template: string, value: string) => template.replace(PLACEHOLDER, value);

interface Props {
  venues: SendVenue[];
  texts: SendTexts;
  apiUrl: string;
}

const OTHER = "__other";
const SHRINK_TO = 2000; // longest side in pixels
const SHRINKABLE = ["image/jpeg", "image/png", "image/webp"];

/** A smaller JPEG for large photos; anything else (or a photo that can't be read) as it is. */
async function shrink(file: File): Promise<File> {
  if (!SHRINKABLE.includes(file.type) || file.size < 400_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, SHRINK_TO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

const megabytes = (bytes: number) => (bytes / 1_000_000).toFixed(1);

export default function SendForm({ venues, texts, apiUrl }: Props) {
  const [kind, setKind] = useState<Kind>("correction");
  const [venue, setVenue] = useState("");
  const [hall, setHall] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [state, setState] = useState<"editing" | "sending" | "sent">("editing");
  const [error, setError] = useState<SendError | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [note, setNote] = useState("");

  // The page is built without a URL: the starting choice (?kind=&venue=&hall=) is read once it
  // loads, along with the time the form was opened.
  useEffect(() => {
    const target = readTarget(location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL */
    setKind(target.kind);
    if (target.venue && venues.some((v) => v.slug === target.venue)) {
      setVenue(target.venue);
      setHall(target.hall ?? "");
    }
    setNote(target.note ? `${target.note}\n` : "");
    setStartedAt(Date.now());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [venues]);

  const halls = useMemo(() => venues.find((v) => v.slug === venue)?.halls ?? [], [venue, venues]);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  const askName = kind === "new_venue" || venue === OTHER;

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    setPreparing(true);
    const prepared = await Promise.all([...list].map(shrink));
    setFiles((current) => [...current, ...prepared].slice(0, MAX_FILES));
    setPreparing(false);
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (total > MAX_TOTAL_BYTES) return setError({ key: "tooLarge" });
    const data = new FormData(event.currentTarget);
    data.delete("files");
    files.forEach((file) => data.append("files", file, file.name));
    data.set("kind", kind);
    data.set("started_at", String(startedAt));
    if (venue && venue !== OTHER) data.set("venue", venue);
    if (hall && venue !== OTHER) data.set("hall", hall);
    setState("sending");
    try {
      const response = await fetch(`${apiUrl}/api/v1/submissions`, { method: "POST", body: data });
      if (response.ok) {
        setState("sent");
        return;
      }
      setError(sendError(response.status, await response.json().catch(() => null)));
    } catch {
      setError({ key: "network" });
    }
    setState("editing");
  };

  const reset = () => {
    setFiles([]);
    setError(null);
    setState("editing");
    setStartedAt(Date.now());
    setFormKey((key) => key + 1);
  };

  const message = (problem: SendError): string => {
    switch (problem.key) {
      case "fileType":
        return fill(texts.errors.fileType, problem.file);
      default:
        return texts.errors[problem.key];
    }
  };

  if (state === "sent") {
    return (
      <div role="status" className="mt-8 rounded border border-rule bg-sheet p-5">
        <p className="text-lg font-semibold">{texts.success}</p>
        <button type="button" onClick={reset} className="mt-4 underline">
          {texts.sendMore}
        </button>
      </div>
    );
  }

  const field = "mt-1 w-full rounded border border-rule bg-sheet px-3 py-2.5 text-ink";
  return (
    <form key={formKey} onSubmit={submit} className="mt-8 grid gap-6" noValidate={false}>
      <fieldset>
        <legend className="font-semibold">{texts.kindLabel}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {KINDS.map((option) => (
            <label
              key={option}
              className="cursor-pointer rounded-full border border-rule px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cue"
            >
              <input
                type="radio"
                name="kind_choice"
                value={option}
                checked={kind === option}
                onChange={() => setKind(option)}
                className="sr-only"
              />
              {texts.kinds[option]}
            </label>
          ))}
        </div>
      </fieldset>

      {kind !== "new_venue" && (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="send-venue" className="block text-sm text-muted">
              {texts.venueLabel}
            </label>
            <select
              id="send-venue"
              value={venue}
              onChange={(event) => {
                setVenue(event.target.value);
                setHall("");
              }}
              className={field}
            >
              <option value="">{texts.venueChoose}</option>
              {venues.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
              <option value={OTHER}>{texts.venueOther}</option>
            </select>
          </div>
          {halls.length > 0 && (
            <div>
              <label htmlFor="send-hall" className="block text-sm text-muted">
                {texts.hallLabel}
              </label>
              <select
                id="send-hall"
                value={hall}
                onChange={(event) => setHall(event.target.value)}
                className={field}
              >
                <option value="">{texts.hallAny}</option>
                {halls.map((h) => (
                  <option key={h.slug} value={h.slug}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {askName && (
        <div>
          <label htmlFor="send-venue-name" className="block text-sm text-muted">
            {texts.venueNameLabel}
          </label>
          <input id="send-venue-name" name="venue_name" dir="auto" className={field} required />
        </div>
      )}

      <div>
        <label htmlFor="send-message" className="block font-semibold">
          {texts.messageLabel}
        </label>
        <p id="send-message-hint" className="text-sm text-muted">
          {texts.messageHint}
        </p>
        <textarea
          id="send-message"
          key={note}
          name="message"
          defaultValue={note}
          dir="auto"
          required
          minLength={3}
          maxLength={5000}
          rows={Math.max(5, note.split("\n").length + 1)}
          aria-describedby="send-message-hint"
          className={field}
        />
      </div>

      <div>
        <p id="send-files-label" className="font-semibold">
          {texts.filesLabel}
        </p>
        <p id="send-files-hint" className="text-sm text-muted">
          {texts.filesHint}
        </p>
        {/* Our own button text (the browser's own is always in its language, not the page's) */}
        <label
          htmlFor="send-files"
          className="mt-2 inline-flex cursor-pointer items-center rounded border border-rule bg-sheet px-3 py-2 text-sm font-semibold text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cue"
        >
          {texts.chooseFiles}
          <input
            id="send-files"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx"
            aria-describedby="send-files-label send-files-hint"
            disabled={files.length >= MAX_FILES}
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
            className="sr-only"
          />
        </label>
        {preparing && <p className="mt-2 text-sm text-muted">{texts.preparing}</p>}
        {files.length > 0 && (
          <ul className="mt-2 grid gap-1 text-sm">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2">
                <span dir="auto" className="min-w-0 truncate">
                  {file.name}
                </span>
                <span className="text-muted">{megabytes(file.size)} MB</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  aria-label={fill(texts.removeFile, file.name)}
                  className="ms-auto rounded border border-rule px-2 text-muted"
                >
                  ×
                </button>
              </li>
            ))}
            <li className={total > MAX_TOTAL_BYTES ? "font-semibold" : "text-muted"}>
              {fill(texts.filesTotal, megabytes(total))}
            </li>
          </ul>
        )}
      </div>

      <fieldset className="grid gap-3">
        <legend className="font-semibold">{texts.contactTitle}</legend>
        <p className="text-sm text-muted">{texts.contactHint}</p>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="send-name" className="block text-sm text-muted">
              {texts.nameLabel}
            </label>
            <input
              id="send-name"
              name="contact_name"
              autoComplete="name"
              dir="auto"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="send-email" className="block text-sm text-muted">
              {texts.emailLabel}
            </label>
            <input
              id="send-email"
              name="contact_email"
              type="email"
              autoComplete="email"
              dir="ltr"
              className={field}
            />
          </div>
        </div>
      </fieldset>

      {/* Hidden from people (and screen readers); bots fill it in */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="send-website">{texts.trap}</label>
        <input id="send-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="rights" value="true" required className="mt-1 size-4" />
        <span>{texts.rights}</span>
      </label>

      <div aria-live="polite">
        {error && (
          <p role="alert" className="mb-3 rounded border border-rule bg-sheet p-3 font-semibold">
            {message(error)}
          </p>
        )}
        <button
          type="submit"
          disabled={state === "sending" || preparing}
          className="rounded bg-ink px-5 py-2.5 font-semibold text-paper disabled:opacity-60"
        >
          {state === "sending" ? texts.sending : texts.submit}
        </button>
      </div>
    </form>
  );
}
