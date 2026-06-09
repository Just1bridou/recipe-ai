import { fetchLmStudioModels } from "@/lib/services/lm-studio";
import { getEnv } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const env = getEnv();
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get("url") || env.LM_STUDIO_BASE_URL;
    const models = await fetchLmStudioModels(baseUrl);
    return Response.json({ models });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur API models" },
      { status: 500 },
    );
  }
}
