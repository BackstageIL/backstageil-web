/**
 * Home page list with a free-text search and the City → Venue → Seats dropdowns. Rendered to HTML at build time (the full list works without
 * JavaScript and for search engines); the controls filter it in the browser. The choice is kept in
 * the URL (?q=&city=&venue=&seats=) so it can be shared and survives "back".
 */
import { useEffect, useMemo, useState } from "react";

import { localePath, strings, type Locale } from "../i18n";
import {
  SEAT_RANGES,
  cityOptions,
  filterVenues,
  filtersHalls,
  outlineScale,
  type VenueListItem,
} from "../lib/venue-list";
import HallRow, { OUTLINE_INNER_HEIGHT, OUTLINE_INNER_WIDTH } from "./HallRow";

interface Props {
  venues: VenueListItem[];
  locale: Locale;
}

export default function VenueBrowser({ venues, locale }: Props) {
  const dictionary = strings(locale);
  const t = dictionary.home;
  const [choice, setChoice] = useState(EMPTY);
  const { query, city, venue, seats } = choice;

  // The page is built without a URL, so a shared choice (?city=&venue=) is restored once it
  // loads. Reading it during the first render would make it differ from the built HTML.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL
    setChoice({
      query: params.get("q") ?? "",
      city: params.get("city") ?? "",
      venue: params.get("venue") ?? "",
      seats: params.get("seats") ?? "",
    });
  }, []);

  const choose = (changes: Partial<Choice>) => {
    const next = { ...choice, ...changes };
    setChoice(next);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key === "query" ? "q" : key, value);
    }
    const search = params.toString();
    history.replaceState(null, "", search ? `?${search}` : location.pathname);
  };

  const cities = useMemo(() => cityOptions(venues, locale), [venues, locale]);
  const scale = useMemo(
    () => outlineScale(venues, OUTLINE_INNER_WIDTH, OUTLINE_INNER_HEIGHT),
    [venues],
  );
  const filters = { seats };
  const { venueOptions, shown } = filterVenues(venues, city, venue, query, filters);

  return (
    <div>
      <div className="mt-6">
        <label htmlFor="q" className="block text-sm text-muted">
          {t.search}
        </label>
        <input
          id="q"
          type="search"
          dir="auto"
          autoComplete="off"
          value={query}
          placeholder={t.searchPlaceholder}
          onChange={(event) => choose({ query: event.target.value, venue: "" })}
          className="mt-1 w-full rounded border border-rule bg-sheet px-3 py-2.5 text-ink"
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Select
          id="city"
          label={t.city}
          value={city}
          onChange={(value) => choose({ city: value, venue: "" })}
          options={[
            { value: "", label: t.allCities },
            ...cities.map((c) => ({ value: c.slug, label: `${c.name} (${c.count})` })),
          ]}
        />
        <Select
          id="venue"
          label={t.venue}
          value={venue}
          onChange={(value) => choose({ venue: value })}
          options={[
            { value: "", label: t.allVenues },
            ...venueOptions.map((v) => ({ value: v.slug, label: v.name })),
          ]}
        />
        <Select
          id="seats"
          label={t.seatsFilter}
          value={seats}
          onChange={(value) => choose({ seats: value, venue: "" })}
          options={[
            { value: "", label: t.anySeats },
            ...Object.keys(SEAT_RANGES).map((range) => ({
              value: range,
              label: t.seatRanges[range as keyof typeof t.seatRanges],
            })),
          ]}
        />
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {t.count(shown.length)}
        {filtersHalls(filters) && <span className="block">{t.knownOnly}</span>}
      </p>

      <ul className="mt-2 border-t border-rule">
        {shown.map((item) => (
          <li key={item.slug} className="border-b border-rule py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <a
                href={localePath(locale, `/venues/${item.slug}/`)}
                className="font-stencil text-2xl font-bold text-ink no-underline hover:underline"
              >
                {item.name}
              </a>
              <span className="text-sm text-muted">
                {item.city.name}
                {item.district && `, ${dictionary.district[item.district]}`}
              </span>
            </div>
            <p className="text-sm text-muted">{dictionary.venueType[item.type]}</p>
            <ul className="mt-3 space-y-2">
              {item.halls.map((hall) => (
                <li key={hall.slug}>
                  <HallRow venue={item.slug} hall={hall} scale={scale} locale={locale} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Choice {
  query: string;
  city: string;
  venue: string;
  seats: string;
}

const EMPTY: Choice = { query: "", city: "", venue: "", seats: "" };

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function Select({ id, label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded border border-rule bg-sheet px-3 py-2.5 text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
