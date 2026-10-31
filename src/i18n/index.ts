/**
 * Languages of the site. English lives at the plain URLs, Hebrew under /he/.
 */
import { en, type Strings } from "./en";
import { he } from "./he";

export type Locale = "en" | "he";
export const LOCALES: readonly Locale[] = ["en", "he"];
export type { Strings };

const DICTIONARIES: Record<Locale, Strings> = { en, he };

export function strings(locale: Locale): Strings {
  return DICTIONARIES[locale];
}

/** The language menu: every language, its own name, the same page in it, and which is shown. */
export function languageOptions(current: Locale, path: string) {
  const page = pathWithoutLocale(path);
  return LOCALES.map((locale) => ({
    locale,
    name: strings(current).locale.names[locale],
    code: strings(current).locale.codes[locale],
    href: localePath(locale, page),
    current: locale === current,
  }));
}

/** The URL of a site path in a language: "/venues/x/" → "/he/venues/x/" for Hebrew. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? clean : `/he${clean}`;
}

/** A URL without its language prefix: "/he/venues/x/" → "/venues/x/". */
export function pathWithoutLocale(path: string): string {
  if (path === "/he" || path === "/he/") return "/";
  return path.startsWith("/he/") ? path.slice(3) : path;
}

/** Prefer the Hebrew name on Hebrew pages when there is one. */
export function nameIn(locale: Locale, item: { name: string; name_he?: string | null }): string {
  return locale === "he" && item.name_he ? item.name_he : item.name;
}

/** Street address in the page language: the Hebrew one on Hebrew pages when there is one. */
export function streetAddress(
  locale: Locale,
  venue: { street_address?: string | null; street_address_he?: string | null },
): string | null {
  return (locale === "he" && venue.street_address_he) || venue.street_address || null;
}

const SOURCE_HE: [RegExp, string][] = [
  [/Online research/g, "מחקר ברשת"],
  [/Site survey/g, "סקר באולם"],
  [/surveyor's drawings/g, "תוכניות מודד"],
  [/stage measurements not yet confirmed with the venue/g, "מידות הבמה טרם אושרו מול המקום"],
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_HE = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

/** A hall's source line in the page language: known phrases and months are translated, the rest is kept. */
export function sourceIn(locale: Locale, source: string): string {
  if (locale !== "he") return source;
  let text = SOURCE_HE.reduce((acc, [pattern, he]) => acc.replace(pattern, he), source);
  text = text.replace(
    /\((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})\)/g,
    (_, m: string, y: string) => `(${MONTHS_HE[MONTHS.indexOf(m)]} ${y})`,
  );
  return text;
}

/** A hall's sources one per item (the API joins them with "; "), so a list can give every part its own
 * line: one line mixing Hebrew and English scrambles on Hebrew pages. On Hebrew pages a part is translated
 * only when its phrase is known (dates too); an untranslated part stays all English, date included. */
export function sourceParts(locale: Locale, source: string): string[] {
  return source
    .split(/;\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (locale !== "he") return part;
      const translated = sourceIn(locale, part);
      return SOURCE_HE.some(([pattern]) => new RegExp(pattern.source).test(part))
        ? translated
        : part;
    });
}

/** City name in the page language (the API sends both). */
export function cityName(locale: Locale, city: { name_en: string; name_he?: string | null }) {
  return locale === "he" && city.name_he ? city.name_he : city.name_en;
}
