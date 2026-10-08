/** The API client for this build, pointed at API_URL (production API by default). */
import { API_URL } from "astro:env/server";

import { createApi } from "./api";

export const api = createApi(API_URL);
