import { getRecipeById } from "@/lib/services/generation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const recipe = await getRecipeById(id);
    if (!recipe) {
      return Response.json({ error: "Recette introuvable" }, { status: 404 });
    }
    return Response.json({ recipe });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Erreur recette",
      },
      { status: 500 },
    );
  }
}
