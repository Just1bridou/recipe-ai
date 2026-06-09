import { describe, expect, it } from "vitest";
import { filterByMainIngredient } from "@/lib/services/generation";

describe("filterByMainIngredient", () => {
  it("removes candidates with blocked ingredient", () => {
    const out = filterByMainIngredient(
      [
        { title: "A", mainIngredient: "tomate" },
        { title: "B", mainIngredient: "poisson" },
      ],
      new Set(["tomate"]),
    );

    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("B");
  });
});
