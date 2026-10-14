/**
 * Turns link preview cards (`og-image.ts`) into PNG files at build time, with the site's fonts
 * from `og-fonts/` (static cuts of Archivo condensed bold, Atkinson Hyperlegible Next and Heebo;
 * SIL Open Font License, see the OFL files there). Node only: never shipped to the browser.
 */
import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";
import { resolve } from "node:path";

import { cardSvg, type Card, type Font, type Measure } from "./og-image";

const FONTS_DIR = resolve(process.cwd(), "src/lib/og-fonts");

const OPTIONS: ResvgRenderOptions = {
  font: {
    fontFiles: [
      "ArchivoCondensed-Bold.ttf",
      "AtkinsonNext-Regular.ttf",
      "Heebo-Bold.ttf",
      "Heebo-Regular.ttf",
    ].map((file) => resolve(FONTS_DIR, file)),
    loadSystemFonts: false, // the same picture on every machine
    defaultFontFamily: "Heebo",
  },
};

const REFERENCE_SIZE = 100;
const widths = new Map<string, number>();

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Text width from the renderer itself (measured once at a reference size, then scaled). */
export const measure: Measure = (text: string, font: Font, size: number) => {
  const key = `${font.family}|${font.weight}|${text}`;
  let width = widths.get(key);
  if (width === undefined) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8000" height="200"><text x="0" y="150" font-family="${font.family}" font-weight="${font.weight}" font-size="${REFERENCE_SIZE}">${escape(text)}</text></svg>`;
    width = new Resvg(svg, OPTIONS).getBBox()?.width ?? 0;
    widths.set(key, width);
  }
  return (width * size) / REFERENCE_SIZE;
};

export function renderCard(card: Card): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(new Resvg(cardSvg(card, measure), OPTIONS).render().asPng());
}
