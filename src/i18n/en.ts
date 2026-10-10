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
