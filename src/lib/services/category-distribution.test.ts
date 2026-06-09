import { describe, expect, it } from "vitest";
import { distributeCategories } from "@/lib/services/category-distribution";

describe("distributeCategories", () => {
  it("returns the requested count", () => {
    const out = distributeCategories(["plat", "salade"], 7);
    expect(out).toHaveLength(7);
  });

  it("rotates across selected categories", () => {
    const out = distributeCategories(["entree", "dessert"], 4);
    expect(out).toEqual(["entree", "dessert", "entree", "dessert"]);
  });
});
