import mongoose, { Schema } from "mongoose";

export interface RecipeDocument {
  title: string;
  category: "entree" | "apero" | "plat" | "salade" | "dessert";
  seasonTag: "printemps" | "ete" | "automne" | "hiver";
  nutritionTag: "equilibre" | "leger";
  mainIngredient: string;
  preview: string;
  details: {
    ingredients: string[];
    steps: string[];
    prepTime: number;
    cookTime: number;
    servings: number;
    healthTips: string[];
  };
  sourceModelId: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<RecipeDocument>(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["entree", "apero", "plat", "salade", "dessert"],
      required: true,
    },
    seasonTag: {
      type: String,
      enum: ["printemps", "ete", "automne", "hiver"],
      required: true,
    },
    nutritionTag: {
      type: String,
      enum: ["equilibre", "leger"],
      required: true,
    },
    mainIngredient: { type: String, required: true },
    preview: { type: String, required: true },
    details: {
      ingredients: [{ type: String, required: true }],
      steps: [{ type: String, required: true }],
      prepTime: { type: Number, required: true },
      cookTime: { type: Number, required: true },
      servings: { type: Number, required: true },
      healthTips: [{ type: String }],
    },
    sourceModelId: { type: String, required: true },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const RecipeModel =
  (mongoose.models.Recipe as mongoose.Model<RecipeDocument>) ||
  mongoose.model<RecipeDocument>("Recipe", recipeSchema);
