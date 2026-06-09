import type { RecipeDetailData } from "@/components/types";
import {
  categoryEmoji,
  categoryLabels,
  nutritionLabels,
  seasonEmoji,
  seasonLabels,
} from "@/components/labels";
import type { Category } from "@/components/types";

interface Props {
  recipe: RecipeDetailData;
}

export function RecipeDetail({ recipe }: Props) {
  const category = recipe.category as Category;

  return (
    <div>
      <div className="detail-hero">
        <span className="recipe-emoji" aria-hidden>
          {categoryEmoji[category]}
        </span>
        <div style={{ minWidth: 0 }}>
          <h2>{recipe.title}</h2>
          <div className="tag-row">
            <span className="tag">{categoryLabels[category]}</span>
            <span className="tag">
              {seasonEmoji[recipe.seasonTag] ?? "📅"}{" "}
              {seasonLabels[recipe.seasonTag] ?? recipe.seasonTag}
            </span>
            <span className="tag">
              {nutritionLabels[recipe.nutritionTag] ?? recipe.nutritionTag}
            </span>
          </div>
        </div>
      </div>

      <p className="detail-preview">{recipe.preview}</p>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-value">{recipe.details.prepTime}′</div>
          <div className="stat-label">Prépa</div>
        </div>
        <div className="stat">
          <div className="stat-value">{recipe.details.cookTime}′</div>
          <div className="stat-label">Cuisson</div>
        </div>
        <div className="stat">
          <div className="stat-value">{recipe.details.servings}</div>
          <div className="stat-label">Portions</div>
        </div>
      </div>

      <div className="detail-block">
        <h3>🧺 Ingrédients</h3>
        <ul className="ingredient-list">
          {recipe.details.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div className="detail-block">
        <h3>👩‍🍳 Préparation</h3>
        <ol className="step-list">
          {recipe.details.steps.map((step, index) => (
            <li key={`${index}-${step.slice(0, 24)}`}>{step}</li>
          ))}
        </ol>
      </div>

      {recipe.details.healthTips.length > 0 && (
        <div className="detail-block tips">
          <h3>🌿 Conseils santé</h3>
          <ul>
            {recipe.details.healthTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
