import { describe, expect, it } from "vitest";
import { seasonFromMonth } from "@/lib/services/season";

describe("seasonFromMonth", () => {
  it("maps january to hiver", () => {
    expect(seasonFromMonth(1)).toBe("hiver");
  });

  it("maps july to ete", () => {
    expect(seasonFromMonth(7)).toBe("ete");
  });
});
