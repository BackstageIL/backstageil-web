/**
 * The vendors directory (BSIL-79): category chips and a region select over the vendor cards.
 * Rendered to HTML at build time (every card is there without JavaScript and for search engines);
 * the controls filter in the browser. The choice is kept in the URL (?type=&region=).
 */
import { useEffect, useState } from "react";

import { localePath, nameIn, strings, type Locale } from "../i18n";
import type { Vendor, VendorCategory } from "../lib/api";
import {
  DISTRICTS,
  categoryCounts,
  descriptionIn,
  filterVendors,
  type VendorFilters,
} from "../lib/vendors";

interface Props {
  vendors: Vendor[];
  locale: Locale;
  /** mailto link for companies that want to be listed */
  joinHref: string;
}

const EMPTY: VendorFilters = { category: "", district: "" };

export default function VendorBrowser({ vendors, locale, joinHref }: Props) {
  const dictionary = strings(locale);
  const t = dictionary.vendors;
  const [filters, setFilters] = useState(EMPTY);

  // Restore a shared choice once the page loads (the built HTML has none)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type") ?? "";
    const region = params.get("region") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL
    setFilters({
      category: (Object.keys(t.categories).includes(type) ? type : "") as VendorFilters["category"],
      district: ((DISTRICTS as readonly string[]).includes(region)
        ? region
        : "") as VendorFilters["district"],
    });
  }, [t.categories]);

  const choose = (changes: Partial<VendorFilters>) => {
    const next = { ...filters, ...changes };
    setFilters(next);
    const params = new URLSearchParams();
    if (next.category) params.set("type", next.category);
    if (next.district) params.set("region", next.district);
    const search = params.toString();
    history.replaceState(null, "", search ? `?${search}` : location.pathname);
  };

  const shown = filterVendors(vendors, filters);
  const chips: { value: VendorCategory | ""; label: string }[] = [
    { value: "", label: t.allCategories },
    ...categoryCounts(vendors).map(({ category }) => ({
      value: category,
      label: t.categories[category],
    })),
  ];

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <fieldset>
          <legend className="text-sm text-muted">{t.category}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.value || "all"}
                type="button"
                aria-pressed={filters.category === chip.value}
                onClick={() => choose({ category: chip.value })}
                className="rounded-full border border-rule bg-sheet px-3 py-1 text-sm text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="region" className="block text-sm text-muted">
            {t.region}
          </label>
          <select
            id="region"
            value={filters.district}
            onChange={(event) =>
              choose({ district: event.target.value as VendorFilters["district"] })
            }
            className="mt-1 rounded border border-rule bg-sheet px-3 py-2 text-ink"
          >
            <option value="">{t.allRegions}</option>
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {dictionary.district[district]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-6 border-b border-rule pb-2 text-sm text-muted" aria-live="polite">
        {shown.length > 0 ? t.count(shown.length) : t.none}
      </p>

      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((vendor) => {
          const name = nameIn(locale, vendor);
          const href = localePath(locale, `/vendors/${vendor.slug}/`);
          const description = descriptionIn(locale, vendor);
          return (
            <li
              key={vendor.slug}
              className="flex flex-col overflow-hidden rounded-lg border border-rule bg-sheet"
            >
              <a href={href} className="block" tabIndex={-1} aria-hidden="true">
                {vendor.logo ? (
                  <img
                    src={vendor.logo.thumbnail_url}
                    width={vendor.logo.width}
                    height={vendor.logo.height}
                    alt=""
                    loading="lazy"
                    className="aspect-[2/1] w-full bg-black object-contain"
                  />
                ) : (
                  <div className="font-stencil flex aspect-[2/1] items-center justify-center bg-paper text-3xl font-bold text-muted">
                    {name}
                  </div>
                )}
              </a>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <a
                  href={href}
                  className="font-stencil text-xl font-bold text-ink no-underline hover:underline"
                >
                  <bdi>{name}</bdi>
                </a>
                {description && (
                  <p className="text-sm" dir="auto">
                    {description}
                  </p>
                )}
                <ul className="flex flex-wrap gap-1.5 text-xs text-muted">
                  {vendor.categories.map((category) => (
                    <li key={category} className="rounded-full border border-rule px-2 py-0.5">
                      {t.categories[category]}
                    </li>
                  ))}
                  <li className="rounded-full border border-rule px-2 py-0.5">
                    {vendor.districts.length === 0
                      ? t.wholeCountry
                      : vendor.districts.map((d) => dictionary.district[d]).join(", ")}
                  </li>
                </ul>
                <a
                  href={`${href}#contact`}
                  className="mt-auto self-start rounded bg-cue px-3 py-1.5 text-sm font-semibold text-white no-underline hover:opacity-90"
                >
                  {t.contactAction}
                </a>
              </div>
            </li>
          );
        })}
        <li className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rule p-6 text-center">
          <p className="font-semibold">{t.join.title}</p>
          <p className="text-sm text-muted">{t.join.text}</p>
          <a href={joinHref} className="text-sm">
            {t.join.action}
          </a>
        </li>
      </ul>
    </div>
  );
}
