import type { Category } from "@/lib/schemas/recipe";

export function distributeCategories(
  categories: Category[],
  count: number,
): Category[] {
  if (categories.length === 0) return [];

  const output: Category[] = [];
  for (let i = 0; i < count; i += 1) {
    output.push(categories[i % categories.length]);
  }
  return output;
}
