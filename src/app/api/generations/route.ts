import { generationRequestSchema } from "@/lib/schemas/recipe";
import { generateWeeklyRecipes } from "@/lib/services/generation";

export async function POST(request: Request) {
  try {
    const payload = generationRequestSchema.parse(await request.json());
    const generation = await generateWeeklyRecipes(payload);
    return Response.json(generation);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Erreur generation",
      },
      { status: 400 },
    );
  }
}
