import type { RecipePreview } from "@/components/types";
import { categoryEmoji, categoryLabels } from "@/components/labels";

interface Props {
  recipe: RecipePreview;
  onOpen: (id: string) => void;
}

export function RecipeCard({ recipe, onOpen }: Props) {
  return (
    <button
      type="button"
      className="recipe-card"
      onClick={() => onOpen(recipe.id)}
    >
      <span className="recipe-emoji" aria-hidden>
        {categoryEmoji[recipe.category]}
      </span>
      <span className="recipe-main">
        <span className="recipe-cat">{categoryLabels[recipe.category]}</span>
        <span className="recipe-title">{recipe.title}</span>
        <span className="recipe-meta">
          <span>🥕 {recipe.mainIngredient}</span>
          <span>⏱ {recipe.totalTime} min</span>
        </span>
      </span>
      <span className="recipe-chevron" aria-hidden>
        ›
      </span>
    </button>
  );
}
