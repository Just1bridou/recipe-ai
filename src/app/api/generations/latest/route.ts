import { getLatestGeneration } from "@/lib/services/generation";

export async function GET() {
  try {
    const latest = await getLatestGeneration();
    return Response.json(latest);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur latest generation",
      },
      { status: 500 },
    );
  }
}
