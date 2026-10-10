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

/** City name in the page language (the API sends both). */
export function cityName(locale: Locale, city: { name_en: string; name_he?: string | null }) {
  return locale === "he" && city.name_he ? city.name_he : city.name_en;
}
