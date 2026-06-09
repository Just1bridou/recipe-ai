import { z } from "zod";
import { getOrCreateSettings, updateSettings } from "@/lib/services/generation";

const updateSchema = z.object({
  provider: z.enum(["chatgpt", "lm-studio"]).optional(),
  modelId: z.string().optional(),
  lmStudioUrl: z.string().optional(),
  defaultRecipeCount: z.number().int().min(1).max(30).optional(),
  defaultNutritionProfile: z
    .enum(["equilibre", "leger", "equilibre-leger"])
    .optional(),
});

export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return Response.json({ settings });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Erreur API settings",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const settings = await updateSettings(payload);
    return Response.json({ settings });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Erreur API settings",
      },
      { status: 400 },
    );
  }
}
