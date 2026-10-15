import { describe, expect, it } from "vitest";

import type { HallDocument, VenueDetail } from "./api";
import { hallJsonLd, jsonLdText, venueJsonLd, websiteJsonLd } from "./structured-data";

const SITE = "https://www.backstageil.com";
const city = {
  slug: "tel-aviv-yafo",
  name_en: "Tel Aviv - Yafo",
  name_he: "תל אביב -יפו",
  district: "tel_aviv",
};
const venue = {
  slug: "habima-theater",
  name: "Habima Theater",
  name_he: "תיאטרון הבימה",
  venue_type: "theater",
  street_address: "2 Tarsat Blvd",
  street_address_he: "שדרות תרס״ט 2",
  website: "https://www.habima.co.il/",
  city,
  halls: [
    { slug: "rovina-hall", name: "Rovina Hall", name_he: "אולם רובינא", capacity_seated: 920 },
    { slug: "meskin-hall", name: "Meskin Hall", name_he: "אולם מסקין", capacity_seated: null },
  ],
} as unknown as VenueDetail;
const hall = {
  slug: "rovina-hall",
  name: "Rovina Hall",
  name_he: "אולם רובינא",
  capacity_seated: 920,
  venue: {
    slug: venue.slug,
    name: venue.name,
    name_he: venue.name_he,
    street_address: venue.street_address,
    street_address_he: venue.street_address_he,
    city,
  },
} as unknown as HallDocument;

describe("venueJsonLd", () => {
  it("describes the venue as a theater with its address, halls and largest capacity", () => {
    const [place, crumbs] = venueJsonLd("en", venue, SITE, "/og/en/venues/habima-theater.png");
    expect(place).toMatchObject({
      "@type": "PerformingArtsTheater",
      "@id": "https://www.backstageil.com/venues/habima-theater/#venue",
      name: "Habima Theater",
      alternateName: "תיאטרון הבימה",
      url: "https://www.backstageil.com/venues/habima-theater/",
      image: "https://www.backstageil.com/og/en/venues/habima-theater.png",
      address: {
        streetAddress: "2 Tarsat Blvd",
        addressLocality: "Tel Aviv - Yafo",
        addressCountry: "IL",
      },
      maximumAttendeeCapacity: 920,
      sameAs: "https://www.habima.co.il/",
    });
    expect(place.containsPlace).toEqual([
      {
        "@type": "EventVenue",
        name: "Rovina Hall",
        url: "https://www.backstageil.com/venues/habima-theater/halls/rovina-hall/",
        maximumAttendeeCapacity: 920,
      },
      {
        "@type": "EventVenue",
        name: "Meskin Hall",
        url: "https://www.backstageil.com/venues/habima-theater/halls/meskin-hall/",
      },
    ]);
    expect(crumbs).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [{ position: 1 }, { position: 2, name: "Habima Theater" }],
    });
  });

  it("uses the Hebrew names, address and URLs on Hebrew pages", () => {
    const [place] = venueJsonLd("he", venue, SITE, "/og/he/venues/habima-theater.png");
    expect(place).toMatchObject({
      name: "תיאטרון הבימה",
      alternateName: "Habima Theater",
      url: "https://www.backstageil.com/he/venues/habima-theater/",
      address: { streetAddress: "שדרות תרס״ט 2", addressLocality: "תל אביב -יפו" },
    });
  });

  it("leaves out what is unknown", () => {
    const bare = {
      ...venue,
      venue_type: "arena",
      website: null,
      street_address: null,
      street_address_he: null,
      halls: [],
    } as unknown as VenueDetail;
    const [place] = venueJsonLd("en", bare, SITE, "/og/x.png");
    expect(place["@type"]).toBe("StadiumOrArena");
    expect(place).not.toHaveProperty("maximumAttendeeCapacity");
    expect(place).not.toHaveProperty("sameAs");
    expect(place.address).not.toHaveProperty("streetAddress");
  });
});

describe("hallJsonLd", () => {
  it("places the hall inside its venue, with breadcrumbs to it", () => {
    const [place, crumbs] = hallJsonLd(
      "en",
      hall,
      SITE,
      "/og/en/venues/habima-theater/halls/rovina-hall.png",
    );
    expect(place).toMatchObject({
      "@type": "EventVenue",
      name: "Rovina Hall, Habima Theater",
      maximumAttendeeCapacity: 920,
      containedInPlace: { "@id": "https://www.backstageil.com/venues/habima-theater/#venue" },
    });
    expect((crumbs.itemListElement as unknown[]).length).toBe(3);
  });
});

describe("websiteJsonLd", () => {
  it("names the site in the page language", () => {
    expect(websiteJsonLd("he", SITE)).toMatchObject({
      "@type": "WebSite",
      url: "https://www.backstageil.com/he/",
      inLanguage: "he",
    });
  });
});

describe("jsonLdText", () => {
  it("can never close the script tag it is written into", () => {
    const text = jsonLdText({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text).name).toBe("</script><script>alert(1)</script>");
  });
});
