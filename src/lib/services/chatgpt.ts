import { z } from "zod";
import { recipeSchema, type Category, type NutritionProfile, type Recipe } from "@/lib/schemas/recipe";

export const CHATGPT_MODEL = "gpt-4.1-nano";

const chatGptResponseSchema = z.object({
  choices: z.array(
    z.object({ message: z.object({ content: z.string() }) }),
  ),
});

export interface GenerateWithChatGptInput {
  apiKey: string;
  season: string;
  categories: Category[];
  recipeCount: number;
  nutritionProfile: NutritionProfile;
  userNotes?: string;
}

export async function generateRecipesWithChatGpt(
  input: GenerateWithChatGptInput,
): Promise<Recipe[]> {
  const promptParts = [
    `Tu es un chef nutritionniste francais.`,
    `Genere exactement ${input.recipeCount} recettes de saison (${input.season}).`,
    `Categories autorisees: ${input.categories.join(", ")}.`,
    `Profil nutritionnel: ${input.nutritionProfile}.`,
  ];

  if (input.userNotes) {
    promptParts.push(`Remarques de l'utilisateur: ${input.userNotes}`);
  }

  promptParts.push(
    `Le resultat doit etre strictement un JSON sans markdown.`,
    `Format attendu: {"recipes":[{"title":string,"category":"entree|apero|plat|salade|dessert","seasonTag":"printemps|ete|automne|hiver","nutritionTag":"equilibre|leger","mainIngredient":string,"preview":string,"details":{"ingredients":string[],"steps":string[],"prepTime":number,"cookTime":number,"servings":number,"healthTips":string[]}}]}`,
  );

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: CHATGPT_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Tu dois toujours repondre avec un JSON valide." },
        { role: "user", content: promptParts.join("\n") },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI erreur ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`,
    );
  }

  const parsed = chatGptResponseSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.choices.length === 0) {
    throw new Error("Reponse ChatGPT invalide");
  }

  const rawContent = parsed.data.choices[0].message.content;
  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(rawContent);
  } catch {
    throw new Error("ChatGPT a renvoye un JSON invalide");
  }

  const recipesCandidate = z
    .object({ recipes: z.array(recipeSchema) })
    .safeParse(parsedContent);
  if (!recipesCandidate.success) {
    throw new Error("ChatGPT a renvoye des recettes invalides");
  }

  return recipesCandidate.data.recipes;
}
