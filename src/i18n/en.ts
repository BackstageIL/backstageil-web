/**
 * English UI strings. Every visible text goes through here; Hebrew (`he.ts`) has exactly the
 * same keys (the `Strings` type below enforces it).
 */
import type { components } from "../lib/api-types";

type Schemas = components["schemas"];

export const en = {
  locale: {
    // Formatting of numbers and dates
    intl: "en-GB",
    // The header language menu; each language is listed by its own name
    language: "Language",
    names: { en: "English", he: "עברית" },
    // Short codes on the menu button (ISO 639-1)
    codes: { en: "EN", he: "HE" },
  },
  units: {
    meters: "m",
    kg: "kg",
    amps: "A",
  },
  site: {
    name: "BackstageIL",
    tagline: "Technical information about performance venues in Israel, for production crews.",
  },
  nav: {
    venues: "Venues",
    about: "About",
    contact: "Contact",
    donate: "Donate",
    menu: "Menu",
  },
  theme: {
    toggle: "Switch light or dark",
  },
  home: {
    title: "Which venue are you loading into?",
    intro:
      "Stage sizes, rigging, power, backstage and house rules for performance venues in Israel.",
    search: "Search",
    searchPlaceholder: "Venue, hall or city",
    city: "City",
    allCities: "All cities",
    venue: "Venue",
    allVenues: "All venues",
    count: (n: number) => (n === 1 ? "1 venue" : `${n} venues`),
    seats: (n: number) => `${n.toLocaleString("en-GB")} seats`,
    stage: (width: string, depth: string) => `Stage ${width} × ${depth}`,
    outline: "Stage outline, all drawn to the same scale",
  },
  contact: {
    title: "Contact",
    description: "Suggest a place, list your business, send photos or correct venue information.",
    intro:
      "Everything on BackstageIL comes from venues and the crews who work in them. Write to us and we'll add it.",
    addressLabel: "Email",
    requests: {
      recommendation: {
        title: "Recommend a place near a venue",
        text: "Crew parking, the loading entrance, a Waze tip, a music store, pharmacy or supermarket, a restaurant, café or hotel. Tell us the venue and what you recommend.",
        subject: "Recommendation near a venue",
        action: "Send a recommendation",
      },
      photos: {
        title: "Send photos of a hall",
        text: "Stage, loading dock, FOH position, dressing rooms. Photos are resized and their location data removed.",
        subject: "Photos",
        action: "Send photos",
      },
      correction: {
        title: "Correct or add information",
        text: "A measurement that changed, a missing detail or a new house rule. Tell us the venue and hall.",
        subject: "Correction",
        action: "Send a correction",
      },
      venue: {
        title: "Add a venue",
        text: "A venue that isn't listed yet. A technical rider or a site survey helps.",
        subject: "New venue",
        action: "Suggest a venue",
      },
    },
  },
  about: {
    title: "About BackstageIL",
    description: "What BackstageIL is, who it's for and where its information comes from.",
    paragraphs: [
      "BackstageIL collects the technical information of performance venues in Israel in one place: stage size, rigging, power, sound, backstage and house rules, plus the places near each venue that crews need.",
      "It's made for the people who load shows in and out: stage managers, production managers, riggers, lighting and sound technicians. Use it to plan the advance, or on your phone on the day.",
      "Each hall shows where its information comes from and when it was last checked: site surveys, the venue's own technical documents and crews who worked there. Venues change, so check the details that matter with the venue before the show.",
      "Using the site is free. If something is missing or wrong, tell us and we'll fix it.",
    ],
    contactLink: "Contact us",
  },
  donate: {
    title: "Support BackstageIL",
    description: "BackstageIL is free. Donations pay for hosting and for surveying more venues.",
    paragraphs: [
      "BackstageIL is free to use and has no paywall. Donations pay for hosting and the domain, and for the time it takes to survey more venues and keep the information current.",
      "Donations go through Ko-fi, by card or PayPal, once or monthly.",
    ],
    button: "Donate on Ko-fi",
  },
  legal: {
    updated: (date: string) => `Last updated: ${date}`,
    footer: {
      label: "Legal",
      terms: "Terms of use",
      privacy: "Privacy",
      accessibility: "Accessibility",
    },
    // "{email}" in a paragraph becomes a link to the contact address
    terms: {
      title: "Terms of use",
      date: "10 October 2026",
      description: "The terms for using BackstageIL, and how far you can rely on its information.",
      sections: [
        {
          heading: "About these terms",
          paragraphs: [
            "BackstageIL (www.backstageil.com) is a free website with technical information about performance venues in Israel, made for production crews. By using the site you accept these terms. If you don't accept them, please don't use the site.",
          ],
        },
        {
          heading: "The information is a starting point",
          paragraphs: [
            "The information comes from public sources, the venues, site surveys and crews who worked there. It may be incomplete, out of date or wrong, and venues change their equipment and rules.",
            "Each hall shows where its information comes from and when it was last checked. Stage measurements marked as not yet confirmed with the venue have not been checked with the venue.",
          ],
        },
        {
          heading: "Confirm with the venue",
          paragraphs: [
            "Before a load-in, confirm with the venue's technical staff everything that matters for safety or planning: rigging points and loads, power, stage size, access and house rules.",
            "Never rely on this site alone for rigging, structural loads or electrical work. Those decisions belong to qualified people on site, following the venue's instructions and the law.",
          ],
        },
        {
          heading: "No warranty, limited liability",
          paragraphs: [
            "The site is provided free of charge and as is, without any warranty. To the extent the law allows, BackstageIL and the people who run it are not liable for any damage, direct or indirect, that results from using the site or relying on its information, including costs, delays or lost income.",
            "Nothing in these terms limits liability that the law does not allow to be limited.",
          ],
        },
        {
          heading: "Venue names",
          paragraphs: [
            "Venue and hall names, and any trademarks, belong to their owners and are used only to identify the venues. BackstageIL is independent and is not affiliated with or endorsed by any venue.",
          ],
        },
        {
          heading: "What you send us",
          paragraphs: [
            "When you send photos, corrections or recommendations, you confirm that you have the right to share them, and you allow BackstageIL to publish, edit and keep them on the site free of charge. We may decline or remove anything. Please don't send photos that show people, or anyone's personal details.",
          ],
        },
        {
          heading: "Places near venues",
          paragraphs: [
            "Places in the Nearby section are listed for convenience. BackstageIL doesn't check or stand behind their services. A paid listing is always marked as sponsored.",
          ],
        },
        {
          heading: "Corrections and removal",
          paragraphs: [
            "If something is wrong, or you represent a venue or a place and want information changed or removed, write to {email}. We handle requests as quickly as we can.",
          ],
        },
        {
          heading: "Using the information",
          paragraphs: [
            "You're welcome to use the information for your own work and to link to any page. Please ask us before copying the site's content in bulk or republishing it as a database.",
          ],
        },
        {
          heading: "Changes and law",
          paragraphs: [
            "We may update these terms; the date above shows the current version. These terms are governed by the laws of the State of Israel, and the courts of Tel Aviv-Yafo have exclusive jurisdiction.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy",
      date: "14 October 2026",
      description: "What BackstageIL collects (very little) and how to reach us about it.",
      sections: [
        {
          heading: "The short version",
          paragraphs: [
            "BackstageIL has no accounts, no forms, no ads and no cookies. We count visits anonymously, without identifying anyone, and don't collect personal information through the site.",
          ],
        },
        {
          heading: "Who we are",
          paragraphs: ["BackstageIL runs this site. You can reach us at {email}."],
        },
        {
          heading: "What we receive",
          paragraphs: [
            "Emails you send us: your address and what you write. We use them only to reply and to act on your request, such as a correction, and delete them when they're no longer needed.",
            "Technical logs: like any website, our hosting provider (Vercel) receives technical data such as your IP address and browser type to deliver the pages and keep the site secure. We don't use it to identify you. Error reports from our server (Sentry) contain no IP addresses or other personal details.",
            "Visit counts: to see which pages are useful, we use Vercel Web Analytics. It uses no cookies and doesn't store your IP address. Each visit is turned into a one-way code that changes every day, so we see totals (pages viewed, the site you came from, country, type of device) but can't tell who you are or follow you from one day to the next.",
            "Your theme choice: if you switch between light and dark, the choice is saved in your own browser and never reaches us. You can clear it in your browser settings.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: ["The site doesn't use cookies."],
        },
        {
          heading: "Services we use",
          paragraphs: [
            "Vercel hosts the site, Sentry collects error reports, and our email is delivered through Namecheap and Google. If you donate, Ko-fi and its payment providers handle the donation under their own privacy policies, and Ko-fi may share your name and message with us; we use them only to thank you.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You can ask to see, correct or delete personal information we hold about you by writing to {email}. We answer within 30 days.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "If we ever add advertising or any tracking beyond the anonymous visit counts, we'll update this page first and ask for your consent wherever the law requires it, before anything is collected.",
          ],
        },
      ],
    },
    accessibility: {
      title: "Accessibility",
      date: "10 October 2026",
      description:
        "How BackstageIL works for people with disabilities, and how to report a problem.",
      sections: [
        {
          heading: "Our commitment",
          paragraphs: [
            "BackstageIL should be usable by everyone, including people with disabilities. We work to meet the Israeli standard IS 5568, which is based on WCAG 2.0, at level AA.",
          ],
        },
        {
          heading: "What we've done",
          paragraphs: [
            "Pages use proper headings, landmarks and lists, and work with a keyboard alone, with a visible focus.",
            "Text has enough contrast in both the light and the dark theme, and pages work when zoomed to 200% and on phones.",
            "Each page declares its language, English or Hebrew. Stage plans also give their measurements as text, and photos have text descriptions.",
            "There are no time limits and no flashing content, and the site respects the reduced-motion setting.",
          ],
        },
        {
          heading: "How we checked",
          paragraphs: [
            "On 10 October 2026 we checked the main pages, in English and Hebrew and in both themes, with an automated accessibility tool (axe, WCAG 2.1 level AA rules), and fixed what it found.",
          ],
        },
        {
          heading: "Known limits",
          paragraphs: [
            "Some venue and field notes are in English only, also on the Hebrew site. Photos sent by crews may have short descriptions.",
          ],
        },
        {
          heading: "Report a problem",
          paragraphs: [
            "If something on the site is hard to use, write to {email} and we'll fix it as soon as we can. This statement was last updated on 10 October 2026.",
          ],
        },
      ],
    },
  },
  notFound: {
    title: "Page not found",
    description: "This page doesn't exist on BackstageIL.",
    text: "This page doesn't exist, or the venue or hall was renamed.",
    back: "Find a venue",
  },
  district: {
    north: "North",
    haifa: "Haifa",
    center: "Center",
    tel_aviv: "Tel Aviv",
    jerusalem: "Jerusalem",
    south: "South",
    judea_samaria: "Judea and Samaria",
  } satisfies Record<Schemas["District"], string>,
  venueType: {
    theater: "Theater",
    culture_hall: "Culture hall",
    concert_hall: "Concert hall",
    club: "Club",
    arena: "Arena",
    amphitheater: "Amphitheater",
    outdoor: "Outdoor venue",
    other: "Venue",
  } satisfies Record<Schemas["VenueType"], string>,
  venue: {
    description: (name: string, city: string) =>
      `Technical information for ${name}, ${city}: halls, stage sizes and places nearby for crews.`,
    map: "Google Maps",
    waze: "Navigate with Waze",
    website: "Venue website",
    halls: "Halls",
    nearby: "Nearby",
    sponsored: "Sponsored",
    distance: (value: number, unit: "m" | "km") => `${value} ${unit} away`,
    groups: {
      crew: {
        title: "Crew essentials",
        empty: "No places listed yet.",
        invite: "Know where crews can park, or a tip for getting in?",
        action: "Send a recommendation",
        subject: (venue: string) => `Crew recommendation for ${venue}`,
      },
      food: {
        title: "Food and stay",
        empty: "No places listed yet.",
        invite: "Own a restaurant, café or hotel near this venue?",
        action: "Write to us",
        subject: (venue: string) => `Business near ${venue}`,
      },
    },
    category: {
      food: "Food",
      coffee: "Coffee",
      bar: "Bar",
      hotel: "Hotel",
      parking: "Parking",
      music_store: "Music store",
      pharmacy: "Pharmacy",
      supermarket: "Supermarket",
      other: "Other",
    } satisfies Record<Schemas["RecommendationCategory"], string>,
  },
  hall: {
    description: (where: string, city: string) =>
      `Technical information for ${where} (${city}): stage, rigging, power, sound and backstage.`,
    photosSubject: (where: string) => `Photos: ${where}`,
    correctionSubject: (where: string) => `Correction: ${where}`,
    plan: "Stage plan",
    planScale: "Drawn to scale from the venue's measurements.",
    planMissing: "No stage measurements yet.",
    planStage: (width: string, depth: string) => `Stage ${width} wide and ${depth} deep`,
    planProscenium: (value: string) => `proscenium opening ${value}`,
    planFirstPipe: (value: string) => `first pipe ${value} upstage of the proscenium`,
    planFoh: (value: string) => `FOH ${value} from the stage`,
    upstage: "Upstage",
    house: "House",
    proscenium: "Proscenium",
    firstPipe: "First pipe",
    centreLine: "CL",
    foh: "FOH",
    view3d: {
      open: "View in 3D",
      close: "Close 3D view",
      reset: "Reset view",
      loading: "Loading the 3D view…",
      failed: "The 3D view couldn't load. The plan above has the same measurements.",
      hint: "Drag to turn, pinch or scroll to zoom.",
      evenlySpaced: "Battens are drawn evenly spaced: their exact positions aren't recorded.",
      figure: "The figure on stage is 1.8 m tall, for scale.",
      title: "3D view of the stage",
      grid: (value: string) => `Grid ${value}`,
    },
    contents: "On this page",
    photos: "Photos",
    noPhotos: "No photos of this hall yet.",
    sendPhotos: "Have photos of this hall?",
    sendPhotosAction: "Send them",
    photoAlt: (n: number, hall: string) => `Photo ${n} of ${hall}`,
    photoCounter: (n: number, total: number) => `${n} of ${total}`,
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    particular: "Particular to this hall",
    source: "Source",
    verified: "Last verified",
    correction: "Something wrong or missing?",
    correctionLink: "Suggest a correction",
    checkWithVenue:
      "Information may be incomplete or out of date. Confirm with the venue before load-in.",
    termsLink: "Terms of use",
  },
  sections: {
    general: "General",
    access: "Access",
    stage: "Stage",
    rigging: "Rigging",
    masking: "Masking",
    power: "Power",
    sound: "Sound",
    lighting: "Lighting and video",
    backstage: "Backstage",
    rules: "House rules",
    seating: "Seating",
    notes: "Notes",
  },
  fields: {
    capacity_seated: "Seated capacity",
    capacity_standing: "Standing capacity",
    load_in_notes: "Load-in",
    case_storage: "Case storage",
    stage_width_m: "Stage width",
    stage_depth_m: "Stage depth",
    proscenium_width_m: "Proscenium opening",
    stage_floor: "Stage floor",
    has_orchestra_pit: "Orchestra pit",
    has_stairs_to_house: "Stairs to the house",
    has_quick_change_area: "Quick-change area",
    grid_height_m: "Grid height",
    pipe_count: "Pipes",
    pipe_type: "Pipe system",
    pipe_load_kg: "Load per pipe",
    first_pipe_distance_m: "First pipe from the proscenium",
    foh_truss_possible: "FOH truss",
    has_lighting_bridge: "Lighting bridge",
    pa_flying_possible: "Flying the PA",
    truss_hanging_possible: "Hanging truss",
    has_masking: "Masking",
    has_black_legs: "Black legs",
    power_circuits_a: "Power circuits",
    has_backup_generator: "Backup generator",
    house_pa: "House PA",
    foh_position: "FOH position",
    foh_distance_m: "FOH distance from the stage",
    follow_spot_positions: "Follow-spot positions",
    has_video_space: "Video position",
    dressing_rooms: "Dressing rooms",
    star_dressing_rooms: "Star dressing rooms",
    has_green_room: "Green room",
    has_showers: "Showers",
    has_artist_toilets: "Artist toilets",
    has_production_office: "Production office",
    has_laundry: "Laundry",
    has_wifi: "Wi-Fi",
    haze_allowed: "Haze",
    stage_screws_allowed: "Screwing into the stage",
    seat_kills: "Seat kills",
    sightlines: "Sightlines",
    notes: "Notes",
    known_issues: "Known issues",
  },
  // Labels of the hall extras the API registers (it sends no label for them)
  extras: {
    stage_shape: "Stage shape",
    stage_extension: "Stage extension",
  } as Record<string, string>,
  values: {
    yes: "Yes",
    no: "No",
    allowed: "Allowed",
    notAllowed: "Not allowed",
    stage_floor: {
      wood: "Wood",
      marley: "Marley",
      concrete: "Concrete",
      other: "Other",
    } satisfies Record<Schemas["StageFloor"], string>,
    pipe_type: {
      counterweight: "Counterweight",
      motorized: "Motorized",
      fixed: "Fixed",
      other: "Other",
    } satisfies Record<Schemas["PipeType"], string>,
  },
} as const;

/** The shape of a dictionary: `en` with its literal strings widened to `string`. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : T;

export type Strings = Widen<typeof en>;
