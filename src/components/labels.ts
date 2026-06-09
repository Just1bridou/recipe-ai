import type { Category } from "@/components/types";

export const categoryLabels: Record<Category, string> = {
  entree: "Entrée",
  apero: "Apéro",
  plat: "Plat",
  salade: "Salade",
  dessert: "Dessert",
};

export const categoryEmoji: Record<Category, string> = {
  entree: "🍤",
  apero: "🥂",
  plat: "🍲",
  salade: "🥗",
  dessert: "🍰",
};

export const seasonEmoji: Record<string, string> = {
  printemps: "🌸",
  ete: "☀️",
  automne: "🍂",
  hiver: "❄️",
};

export const seasonLabels: Record<string, string> = {
  printemps: "Printemps",
  ete: "Été",
  automne: "Automne",
  hiver: "Hiver",
};

export const nutritionLabels: Record<string, string> = {
  equilibre: "Équilibré",
  leger: "Léger",
  "equilibre-leger": "Équilibré + léger",
};

/** Trim a long model id to a friendly short name. */
export function shortModelName(id: string): string {
  const tail = id.split("/").pop() ?? id;
  return tail.replace(/-?gguf$/i, "").replace(/[-_]/g, " ").trim() || id;
}
