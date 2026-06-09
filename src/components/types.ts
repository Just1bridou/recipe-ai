export type Category = "entree" | "apero" | "plat" | "salade" | "dessert";

export interface RecipePreview {
  id: string;
  title: string;
  category: Category;
  mainIngredient: string;
  preview: string;
  totalTime: number;
}

export interface RecipeDetailData {
  _id: string;
  title: string;
  category: Category;
  seasonTag: string;
  nutritionTag: string;
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
}
