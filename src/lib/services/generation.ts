import { connectToDatabase } from "@/lib/db";
import { RecipeModel } from "@/lib/models/Recipe";
import { WeeklyGenerationModel } from "@/lib/models/WeeklyGeneration";
import { SettingModel } from "@/lib/models/Setting";
import { GenerationLogModel } from "@/lib/models/GenerationLog";
import type { Category, GenerationRequest, Recipe } from "@/lib/schemas/recipe";
import { getCurrentSeason } from "@/lib/services/season";
import { generateRecipesWithLmStudio } from "@/lib/services/lm-studio";
import { generateRecipesWithChatGpt } from "@/lib/services/chatgpt";
import { getEnv, getOpenAiApiKey } from "@/lib/env";

export interface RecipePreview {
  id: string;
  title: string;
  category: Category;
  mainIngredient: string;
  preview: string;
  totalTime: number;
}

export function filterByMainIngredient<T extends { mainIngredient: string }>(
  candidates: T[],
  blocked: Set<string>,
) {
  return candidates.filter(
    (item) => !blocked.has(item.mainIngredient.toLowerCase().trim()),
  );
}

function toWeekKey(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const day = Math.floor((date.getTime() - firstDay.getTime()) / dayMs) + 1;
  const week = Math.ceil(day / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function getOrCreateSettings() {
  await connectToDatabase();

  const existing = await SettingModel.findOne().lean();
  if (existing) return existing;

  const created = await SettingModel.create({
    provider: "chatgpt",
    modelId: "",
    defaultRecipeCount: 7,
    defaultNutritionProfile: "equilibre-leger",
  });

  return created.toObject();
}

export async function updateSettings(input: {
  provider?: "chatgpt" | "lm-studio";
  modelId?: string;
  lmStudioUrl?: string;
  defaultRecipeCount?: number;
  defaultNutritionProfile?: "equilibre" | "leger" | "equilibre-leger";
}) {
  await connectToDatabase();

  const settings = await getOrCreateSettings();

  await SettingModel.updateOne(
    { _id: settings._id },
    {
      $set: {
        provider: input.provider ?? settings.provider ?? "chatgpt",
        modelId: input.modelId ?? settings.modelId,
        lmStudioUrl: input.lmStudioUrl ?? settings.lmStudioUrl ?? "",
        defaultRecipeCount:
          input.defaultRecipeCount ?? settings.defaultRecipeCount,
        defaultNutritionProfile:
          input.defaultNutritionProfile ?? settings.defaultNutritionProfile,
      },
    },
  );

  return getOrCreateSettings();
}

export async function generateWeeklyRecipes(input: GenerationRequest) {
  await connectToDatabase();

  const settings = await getOrCreateSettings();
  const provider = settings.provider ?? "chatgpt";

  if (provider === "lm-studio" && !settings.modelId) {
    throw new Error("Choisis un modele LM Studio dans les parametres");
  }

  const env = getEnv();
  const season = getCurrentSeason();
  const recentRecipes = await RecipeModel.find()
    .sort({ generatedAt: -1 })
    .limit(40)
    .lean();

  const blockedIngredients = new Set(
    recentRecipes.map((recipe) => recipe.mainIngredient.toLowerCase().trim()),
  );

  let parsedRecipes: Recipe[] = [];
  const rawModelResponse = "";

  try {
    if (provider === "chatgpt") {
      parsedRecipes = await generateRecipesWithChatGpt({
        apiKey: getOpenAiApiKey(),
        season,
        categories: input.categories,
        recipeCount: input.recipeCount,
        nutritionProfile: input.nutritionProfile,
        userNotes: input.userNotes,
      });
    } else {
      parsedRecipes = await generateRecipesWithLmStudio({
        baseUrl: settings.lmStudioUrl || env.LM_STUDIO_BASE_URL,
        modelId: settings.modelId,
        season,
        categories: input.categories,
        recipeCount: input.recipeCount,
        nutritionProfile: input.nutritionProfile,
        userNotes: input.userNotes,
      });
    }
  } catch (error) {
    await GenerationLogModel.create({
      requestPrompt: `${season}|${input.categories.join(",")}|${input.recipeCount}`,
      rawModelResponse,
      parseStatus: "failed",
      errorMessages: [
        error instanceof Error ? error.message : "Generation inconnue",
      ],
    });
    throw error;
  }

  const uniqueRecipes = filterByMainIngredient(
    parsedRecipes,
    blockedIngredients,
  );
  const completedRecipes = [...uniqueRecipes];

  for (const recipe of parsedRecipes) {
    if (completedRecipes.length >= input.recipeCount) break;
    if (completedRecipes.find((item) => item.title === recipe.title)) continue;
    completedRecipes.push(recipe);
  }

  const selectedRecipes = completedRecipes.slice(0, input.recipeCount);

  const createdRecipes = await RecipeModel.insertMany(
    selectedRecipes.map((recipe) => ({
      ...recipe,
      sourceModelId: provider === "chatgpt" ? "gpt-4.1-nano" : settings.modelId,
      generatedAt: new Date(),
    })),
  );

  const weekKey = toWeekKey(new Date());

  await WeeklyGenerationModel.create({
    weekKey,
    recipeIds: createdRecipes.map((recipe) => recipe._id),
    filters: {
      categories: input.categories,
      recipeCount: input.recipeCount,
      nutritionProfile: input.nutritionProfile,
      seasonMode: "month-based",
    },
  });

  await GenerationLogModel.create({
    requestPrompt: `${season}|${input.categories.join(",")}|${input.recipeCount}`,
    rawModelResponse,
    parseStatus: "success",
    errorMessages: [],
  });

  return {
    weekKey,
    recipes: createdRecipes.map((recipe) => ({
      id: recipe._id.toString(),
      title: recipe.title,
      category: recipe.category,
      mainIngredient: recipe.mainIngredient,
      preview: recipe.preview,
      totalTime: recipe.details.prepTime + recipe.details.cookTime,
    })) as RecipePreview[],
  };
}

export async function getLatestGeneration() {
  await connectToDatabase();

  const latest = await WeeklyGenerationModel.findOne()
    .sort({ createdAt: -1 })
    .lean();
  if (!latest) return { weekKey: null, recipes: [] as RecipePreview[] };

  const recipes = await RecipeModel.find({
    _id: { $in: latest.recipeIds },
  }).lean();

  return {
    weekKey: latest.weekKey,
    recipes: recipes.map((recipe) => ({
      id: recipe._id.toString(),
      title: recipe.title,
      category: recipe.category,
      mainIngredient: recipe.mainIngredient,
      preview: recipe.preview,
      totalTime: recipe.details.prepTime + recipe.details.cookTime,
    })) as RecipePreview[],
  };
}

export async function getRecipeById(id: string) {
  await connectToDatabase();
  const recipe = await RecipeModel.findById(id).lean();
  return recipe;
}
