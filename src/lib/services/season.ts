import type { SeasonTag } from "@/lib/schemas/recipe";

export function seasonFromMonth(month: number): SeasonTag {
  if ([12, 1, 2].includes(month)) return "hiver";
  if ([3, 4, 5].includes(month)) return "printemps";
  if ([6, 7, 8].includes(month)) return "ete";
  return "automne";
}

export function getCurrentSeason(): SeasonTag {
  const month = new Date().getMonth() + 1;
  return seasonFromMonth(month);
}
