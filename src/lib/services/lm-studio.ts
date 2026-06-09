import { z } from "zod";
import {
  recipeSchema,
  type Category,
  type NutritionProfile,
  type Recipe,
} from "@/lib/schemas/recipe";

const modelListSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
});

const modelResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    }),
  ),
});

export interface GenerateWithLmStudioInput {
  baseUrl: string;
  modelId: string;
  season: string;
  categories: Category[];
  recipeCount: number;
  nutritionProfile: NutritionProfile;
  userNotes?: string;
}

export async function fetchLmStudioModels(baseUrl: string) {
  const response = await fetch(`${baseUrl}/v1/models`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de recuperer les modeles LM Studio");
  }

  const parsed = modelListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Reponse modele LM Studio invalide");
  }

  return parsed.data.data.map((item) => ({ id: item.id, name: item.id }));
}

export async function generateRecipesWithLmStudio(
  input: GenerateWithLmStudioInput,
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
    `Format attendu: {\"recipes\":[{\"title\":string,\"category\":\"entree|apero|plat|salade|dessert\",\"seasonTag\":\"printemps|ete|automne|hiver\",\"nutritionTag\":\"equilibre|leger\",\"mainIngredient\":string,\"preview\":string,\"details\":{\"ingredients\":string[],\"steps\":string[],\"prepTime\":number,\"cookTime\":number,\"servings\":number,\"healthTips\":string[]}}]}`,
  );

  const prompt = promptParts.join("\n");

  const response = await fetch(`${input.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.modelId,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "Tu dois toujours repondre avec un JSON valide.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Generation LM Studio indisponible");
  }

  const parsedResponse = modelResponseSchema.safeParse(await response.json());
  if (!parsedResponse.success || parsedResponse.data.choices.length === 0) {
    throw new Error("Reponse generation LM Studio invalide");
  }

  const rawContent = parsedResponse.data.choices[0].message.content;
  let parsedContent: unknown;

  console.log("Contenu du message du modèle:", rawContent);

  try {
    parsedContent = JSON.parse(rawContent);
  } catch {
    throw new Error("Le modele a renvoye un JSON invalide");
  }

  const recipesCandidate = z
    .object({ recipes: z.array(recipeSchema) })
    .safeParse(parsedContent);
  if (!recipesCandidate.success) {
    throw new Error("Le modele a renvoye des recettes invalides");
  }

  return recipesCandidate.data.recipes;
}
