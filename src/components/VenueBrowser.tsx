/**
 * Home page list with the City → Venue dropdowns. Rendered to HTML at build time (the full list
 * works without JavaScript and for search engines); the dropdowns filter it in the browser.
 * The choice is kept in the URL (?city=&venue=) so it can be shared and survives "back".
 */
import { useEffect, useMemo, useState } from "react";

import { localePath, strings, type Locale } from "../i18n";
import { cityOptions, filterVenues, outlineScale, type VenueListItem } from "../lib/venue-list";
import HallRow, { OUTLINE_HEIGHT, OUTLINE_WIDTH } from "./HallRow";

interface Props {
  venues: VenueListItem[];
  locale: Locale;
}

export default function VenueBrowser({ venues, locale }: Props) {
  const dictionary = strings(locale);
  const t = dictionary.home;
  const [{ city, venue }, setChoice] = useState({ city: "", venue: "" });

  // The page is built without a URL, so a shared choice (?city=&venue=) is restored once it
  // loads. Reading it during the first render would make it differ from the built HTML.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL
    setChoice({ city: params.get("city") ?? "", venue: params.get("venue") ?? "" });
  }, []);

  const choose = (next: { city: string; venue: string }) => {
    setChoice(next);
    const params = new URLSearchParams();
    if (next.city) params.set("city", next.city);
    if (next.venue) params.set("venue", next.venue);
    const query = params.toString();
    history.replaceState(null, "", query ? `?${query}` : location.pathname);
  };

  const cities = useMemo(() => cityOptions(venues, locale), [venues, locale]);
  const scale = useMemo(() => outlineScale(venues, OUTLINE_WIDTH, OUTLINE_HEIGHT), [venues]);
  const { venueOptions, shown } = filterVenues(venues, city, venue);

  return (
    <div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
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
          onChange={(value) => choose({ city, venue: value })}
          options={[
            { value: "", label: t.allVenues },
            ...venueOptions.map((v) => ({ value: v.slug, label: v.name })),
          ]}
        />
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {t.count(shown.length)}
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
