import { z } from "zod";

export const categorySchema = z.enum([
  "entree",
  "apero",
  "plat",
  "salade",
  "dessert",
]);

export const seasonSchema = z.enum(["printemps", "ete", "automne", "hiver"]);

export const nutritionSchema = z.enum([
  "equilibre",
  "leger",
  "equilibre-leger",
]);

export const recipeSchema = z.object({
  title: z.string().min(3),
  category: categorySchema,
  seasonTag: seasonSchema,
  nutritionTag: z.enum(["equilibre", "leger"]),
  mainIngredient: z.string().min(2),
  preview: z.string().min(10),
  details: z.object({
    ingredients: z.array(z.string().min(1)).min(1),
    steps: z.array(z.string().min(1)).min(1),
    prepTime: z.number().int().nonnegative(),
    cookTime: z.number().int().nonnegative(),
    servings: z.number().int().positive(),
    healthTips: z.array(z.string().min(1)).default([]),
  }),
});

export const generationRequestSchema = z.object({
  recipeCount: z.number().int().min(1).max(30).default(7),
  categories: z.array(categorySchema).min(1),
  nutritionProfile: nutritionSchema.default("equilibre-leger"),
  userNotes: z.string().optional(),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type Category = z.infer<typeof categorySchema>;
export type SeasonTag = z.infer<typeof seasonSchema>;
export type NutritionProfile = z.infer<typeof nutritionSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
