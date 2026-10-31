/**
 * "View in 3D" under the 2D stage plan. Only a button until it is tapped: then three.js and the
 * scene load (a separate download), so the hall page and its 2D plan stay light on phones.
 */
import { useEffect, useRef, useState } from "react";

import type { MountedStage, SceneLabels } from "../lib/stage-3d-scene";
import type { StageModel } from "../lib/stage-model";

export interface Stage3DTexts {
  open: string;
  close: string;
  reset: string;
  loading: string;
  failed: string;
  hint: string;
  evenlySpaced: string;
  figure: string;
  title: string;
}

interface Props {
  model: StageModel;
  labels: SceneLabels;
  texts: Stage3DTexts;
  /** The 2D plan's text description, read by screen readers for the 3D view too */
  description: string;
}

type State = "closed" | "loading" | "open" | "failed";

export default function Stage3D({ model, labels, texts, description }: Props) {
  const [state, setState] = useState<State>("closed");
  const box = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLElement>(null);
  const stage = useRef<MountedStage | null>(null);

  useEffect(() => {
    if (state !== "loading" || !box.current) return;
    let cancelled = false;
    import("../lib/stage-3d-scene")
      .then(({ mountStage }) => {
        if (cancelled || !box.current) return;
        stage.current = mountStage(box.current, model, labels);
        setState("open");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [state, model, labels]);

  useEffect(() => () => stage.current?.dispose(), []);

  // On a laptop the plan's column is sticky (pinned by its top). With the 3D open it is taller than
  // the screen, so the 3D and its buttons would stay below the screen until the end of the page
  // (BSIL-70). While it is open, pin the column by its bottom edge instead (a negative top), and on
  // opening scroll just enough to show the whole 3D. No inner scrollbar: it would fight the zoom.
  const shown = state !== "closed";
  useEffect(() => {
    const view = figure.current;
    const column = view?.closest("aside");
    if (!shown || !view || !column) return;
    const gap = 24; // the column's usual top offset
    const fit = () => {
      const room = window.innerHeight - column.offsetHeight - gap;
      column.style.top = room < gap ? `${room}px` : "";
    };
    fit();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    view.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    const resized = new ResizeObserver(fit);
    resized.observe(column);
    window.addEventListener("resize", fit);
    return () => {
      resized.disconnect();
      window.removeEventListener("resize", fit);
      column.style.top = "";
    };
  }, [shown]);

  const close = () => {
    stage.current?.dispose();
    stage.current = null;
    setState("closed");
  };

  if (state === "closed") {
    return (
      <button
        type="button"
        onClick={() => setState("loading")}
        className="mt-3 inline-flex items-center gap-2 rounded border border-rule bg-sheet px-3 py-2 text-sm font-semibold text-ink hover:bg-paper"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.3 6.6 3.7L12 11.7 5.4 8 12 4.3zM5 9.7l6 3.4v6.6l-6-3.4V9.7zm8 10v-6.6l6-3.4v6.6l-6 3.4z"
            fill="currentColor"
          />
        </svg>
        {texts.open}
      </button>
    );
  }

  return (
    <figure ref={figure} className="mt-3">
      <div
        ref={box}
        role="img"
        aria-label={`${texts.title}: ${description}`}
        tabIndex={0}
        className="stage3d relative aspect-[4/3] w-full overflow-hidden rounded border border-rule bg-sheet"
      >
        {state === "loading" && (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted">
            {texts.loading}
          </p>
        )}
        {state === "failed" && (
          <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted">
            {texts.failed}
          </p>
        )}
      </div>
      <figcaption className="mt-2 space-y-1 text-sm text-muted">
        <p>{texts.hint}</p>
        <p>{texts.figure}</p>
        {model.battensEvenlySpaced && <p>{texts.evenlySpaced}</p>}
      </figcaption>
      <div className="mt-2 flex gap-2">
        {state === "open" && (
          <button
            type="button"
            onClick={() => stage.current?.reset()}
            className="rounded border border-rule bg-sheet px-3 py-1.5 text-sm text-ink hover:bg-paper"
          >
            {texts.reset}
          </button>
        )}
        <button
          type="button"
          onClick={close}
          className="rounded border border-rule bg-sheet px-3 py-1.5 text-sm text-ink hover:bg-paper"
        >
          {texts.close}
        </button>
      </div>
    </figure>
  );
}
