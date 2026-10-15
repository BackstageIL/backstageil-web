import { describe, expect, it } from "vitest";

import { readTarget, sendError, sendPath } from "./send";

describe("sendPath", () => {
  it("links to the form in the page language with the target filled in", () => {
    expect(sendPath("en")).toBe("/send/");
    expect(sendPath("he", { kind: "photos", venue: "habima-theater", hall: "rovina-hall" })).toBe(
      "/he/send/?kind=photos&venue=habima-theater&hall=rovina-hall",
    );
  });
});

describe("readTarget", () => {
  it("reads the kind, venue and hall from the address", () => {
    expect(readTarget("?kind=photos&venue=habima-theater&hall=rovina-hall")).toEqual({
      kind: "photos",
      venue: "habima-theater",
      hall: "rovina-hall",
    });
  });

  it("ignores unknown kinds and anything that isn't a slug", () => {
    expect(readTarget("?kind=spam&venue=<script>&hall=Main Hall")).toEqual({
      kind: "correction",
      venue: undefined,
      hall: undefined,
    });
  });
});

describe("sendError", () => {
  it.each([
    [413, {}, { key: "tooLarge" }],
    [429, {}, { key: "tooMany" }],
    [503, {}, { key: "filesUnavailable" }],
    [
      422,
      { detail: [{ msg: "Value error, looks like a phone number or email (personal ...)" }] },
      { key: "personal" },
    ],
    [
      422,
      { error_code: "INVALID_SUBMISSION_FILE", details: { file: "x.exe" } },
      { key: "fileType", file: "x.exe" },
    ],
    [422, { detail: [] }, { key: "invalid" }],
    [500, null, { key: "invalid" }],
  ])("%i → %o", (status, body, expected) => {
    expect(sendError(status, body)).toEqual(expected);
  });
});

describe("sendTexts", () => {
  it("turns every text into plain data a browser component can receive", async () => {
    const { sendTexts } = await import("../components/SendForm");
    const { strings } = await import("../i18n");
    for (const locale of ["en", "he"] as const) {
      const texts = sendTexts(strings(locale).send, "info@example.test");
      const functions: string[] = [];
      const walk = (value: unknown, path: string) => {
        if (typeof value === "function") functions.push(path);
        else if (value && typeof value === "object")
          Object.entries(value).forEach(([k, v]) => walk(v, `${path}.${k}`));
      };
      walk(texts, locale);
      expect(functions).toEqual([]);
      expect(texts.errors.tooLarge).toContain("info@example.test");
      expect(texts.removeFile).toContain("{value}");
    }
  });
});

describe("note", () => {
  it("goes into the form link and back out, length-capped", async () => {
    const { readTarget, sendPath } = await import("./send");
    const path = sendPath("he", {
      kind: "correction",
      venue: "habima-theater",
      hall: "rovina-hall",
      note: "גובה הגריד: \nמעגלי חשמל: ",
    });
    expect(readTarget(path.split("?")[1]).note).toBe("גובה הגריד: \nמעגלי חשמל: ");
    expect(readTarget("note=" + "x".repeat(2000)).note).toHaveLength(600);
    expect(readTarget("kind=photos").note).toBeUndefined();
  });
});
