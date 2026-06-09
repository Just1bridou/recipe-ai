import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("throws when MONGODB_URI is missing", () => {
    expect(() =>
      parseEnv({
        MONGODB_URI: undefined,
        MONGODB_DB_NAME: "recipe_local",
        LM_STUDIO_BASE_URL: "http://127.0.0.1:1234",
      }),
    ).toThrow();
  });

  it("accepts valid env values", () => {
    expect(() =>
      parseEnv({
        MONGODB_URI: "mongodb://127.0.0.1:27017",
        MONGODB_DB_NAME: "recipe_local",
        LM_STUDIO_BASE_URL: "http://127.0.0.1:1234",
      }),
    ).not.toThrow();
  });
});
