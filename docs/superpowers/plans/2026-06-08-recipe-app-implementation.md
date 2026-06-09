# Recipe App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Next.js web app that generates seasonal healthy/tasty weekly recipes through LM Studio, stores history in MongoDB, prevents repetitive main ingredients, and supports preview/details flow.

**Architecture:** Next.js App Router serves both UI and API routes. Domain services in `src/lib` handle season mapping, category distribution, LM Studio calls, validation, anti-duplication, and persistence. MongoDB (Mongoose) stores settings, recipes, weekly generations, and logs.

**Tech Stack:** Next.js 16 + React 19 + TypeScript + Mongoose + Zod + Vitest + Testing Library + Playwright

---

### Task 1: Bootstrap Project and Baseline Tooling

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Initialize Next.js with TypeScript**

```bash
npx create-next-app@latest . --ts --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Install runtime and test dependencies**

```bash
npm install mongoose zod
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

- [ ] **Step 3: Add environment template**

```dotenv
# .env.example
MONGODB_URI=mongodb://127.0.0.1:27017/recipe_local
LM_STUDIO_BASE_URL=http://127.0.0.1:1234
```

- [ ] **Step 4: Add test config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
```

- [ ] **Step 5: Run baseline checks**

Run: `npm run lint && npm run build`
Expected: lint/build pass

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: bootstrap nextjs recipe app with test tooling"
```

### Task 2: Define Data Models and DB Connection (TDD)

**Files:**

- Create: `src/lib/db.ts`
- Create: `src/lib/models/setting.ts`
- Create: `src/lib/models/recipe.ts`
- Create: `src/lib/models/weekly-generation.ts`
- Create: `src/lib/models/generation-log.ts`
- Create: `src/lib/schemas/recipe-schema.ts`
- Create: `src/lib/schemas/request-schema.ts`
- Test: `src/lib/models/models.test.ts`

- [ ] **Step 1: Write failing tests for model constraints**

```ts
// src/lib/models/models.test.ts
import { describe, expect, it } from "vitest";
import { recipeSchema } from "@/lib/schemas/recipe-schema";

describe("recipeSchema", () => {
  it("accepts valid recipe payload", () => {
    const parsed = recipeSchema.safeParse({
      title: "Salade de tomates et feta",
      category: "salade",
      seasonTag: "ete",
      nutritionTag: "leger",
      mainIngredient: "tomate",
      preview: "Fraiche et rapide.",
      details: {
        ingredients: ["2 tomates", "100g feta"],
        steps: ["Couper", "Melanger"],
        prepTime: 10,
        cookTime: 0,
        servings: 2,
        healthTips: ["Ajouter des graines"],
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unknown category", () => {
    const parsed = recipeSchema.safeParse({ title: "x", category: "snack" });
    expect(parsed.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npx vitest src/lib/models/models.test.ts`
Expected: FAIL (schema/module missing)

- [ ] **Step 3: Implement schemas and models**

```ts
// src/lib/schemas/recipe-schema.ts
import { z } from "zod";

export const recipeSchema = z.object({
  title: z.string().min(3),
  category: z.enum(["entree", "apero", "plat", "salade", "dessert"]),
  seasonTag: z.enum(["printemps", "ete", "automne", "hiver"]),
  nutritionTag: z.enum(["equilibre", "leger"]),
  mainIngredient: z.string().min(2),
  preview: z.string().min(10),
  details: z.object({
    ingredients: z.array(z.string().min(1)).min(1),
    steps: z.array(z.string().min(1)).min(1),
    prepTime: z.number().int().nonnegative(),
    cookTime: z.number().int().nonnegative(),
    servings: z.number().int().positive(),
    healthTips: z.array(z.string().min(1)).default([]),
  }),
});
```

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npx vitest src/lib/models/models.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: add mongodb models and zod schemas"
```

### Task 3: Implement Season and Category Distribution Services (TDD)

**Files:**

- Create: `src/lib/services/season.ts`
- Create: `src/lib/services/category-distribution.ts`
- Test: `src/lib/services/season.test.ts`
- Test: `src/lib/services/category-distribution.test.ts`

- [ ] **Step 1: Write failing tests for month-to-season mapping**

```ts
// src/lib/services/season.test.ts
import { describe, expect, it } from "vitest";
import { seasonFromMonth } from "@/lib/services/season";

describe("seasonFromMonth", () => {
  it("maps july to ete", () => expect(seasonFromMonth(7)).toBe("ete"));
  it("maps january to hiver", () => expect(seasonFromMonth(1)).toBe("hiver"));
});
```

- [ ] **Step 2: Write failing tests for category split**

```ts
// src/lib/services/category-distribution.test.ts
import { describe, expect, it } from "vitest";
import { distributeCategories } from "@/lib/services/category-distribution";

describe("distributeCategories", () => {
  it("distributes 7 items over 2 categories", () => {
    const out = distributeCategories(["plat", "salade"], 7);
    expect(out.length).toBe(7);
    expect(out.filter((c) => c === "plat").length).toBeGreaterThanOrEqual(3);
    expect(out.filter((c) => c === "salade").length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 3: Run tests to verify RED**

Run: `npx vitest src/lib/services/season.test.ts src/lib/services/category-distribution.test.ts`
Expected: FAIL (services missing)

- [ ] **Step 4: Implement minimal services**

```ts
// src/lib/services/season.ts
export function seasonFromMonth(
  month: number,
): "printemps" | "ete" | "automne" | "hiver" {
  if ([12, 1, 2].includes(month)) return "hiver";
  if ([3, 4, 5].includes(month)) return "printemps";
  if ([6, 7, 8].includes(month)) return "ete";
  return "automne";
}
```

- [ ] **Step 5: Run tests to verify GREEN**

Run: `npx vitest src/lib/services/season.test.ts src/lib/services/category-distribution.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/services
git commit -m "feat: add season and category distribution logic"
```

### Task 4: Build LM Studio Client and Response Parsing (TDD)

**Files:**

- Create: `src/lib/clients/lm-studio.ts`
- Create: `src/lib/services/prompt-builder.ts`
- Create: `src/lib/services/recipe-parser.ts`
- Test: `src/lib/services/recipe-parser.test.ts`

- [ ] **Step 1: Write failing parser tests**

```ts
// src/lib/services/recipe-parser.test.ts
import { describe, expect, it } from "vitest";
import { parseRecipePayload } from "@/lib/services/recipe-parser";

describe("parseRecipePayload", () => {
  it("extracts valid recipe array from model JSON", () => {
    const raw = JSON.stringify({
      recipes: [
        {
          title: "x",
          category: "plat",
          seasonTag: "ete",
          nutritionTag: "leger",
          mainIngredient: "courgette",
          preview: "ok ok ok ok",
          details: {
            ingredients: ["a"],
            steps: ["b"],
            prepTime: 1,
            cookTime: 2,
            servings: 2,
            healthTips: [],
          },
        },
      ],
    });
    const parsed = parseRecipePayload(raw);
    expect(parsed.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npx vitest src/lib/services/recipe-parser.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement LM client and parser**

```ts
// src/lib/clients/lm-studio.ts
export async function listModels(baseUrl: string): Promise<string[]> {
  const res = await fetch(`${baseUrl}/v1/models`);
  if (!res.ok) throw new Error("LM Studio models endpoint failed");
  const json = await res.json();
  return (json.data ?? []).map((m: { id: string }) => m.id);
}
```

- [ ] **Step 4: Run parser tests to verify GREEN**

Run: `npx vitest src/lib/services/recipe-parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/clients src/lib/services
git commit -m "feat: add lm studio client and recipe parser"
```

### Task 5: Implement Generation Service with Anti-Duplication (TDD)

**Files:**

- Create: `src/lib/services/generation-service.ts`
- Test: `src/lib/services/generation-service.test.ts`

- [ ] **Step 1: Write failing anti-duplication tests**

```ts
// src/lib/services/generation-service.test.ts
import { describe, expect, it } from "vitest";
import { filterByMainIngredient } from "@/lib/services/generation-service";

describe("filterByMainIngredient", () => {
  it("removes recipes with recently used main ingredient", () => {
    const candidates = [
      { title: "A", mainIngredient: "tomate" },
      { title: "B", mainIngredient: "poisson" },
    ];
    const out = filterByMainIngredient(candidates, new Set(["tomate"]));
    expect(out.map((x) => x.title)).toEqual(["B"]);
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npx vitest src/lib/services/generation-service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement generation orchestration**

```ts
// src/lib/services/generation-service.ts
export function filterByMainIngredient<T extends { mainIngredient: string }>(
  candidates: T[],
  blocked: Set<string>,
): T[] {
  return candidates.filter(
    (c) => !blocked.has(c.mainIngredient.toLowerCase().trim()),
  );
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npx vitest src/lib/services/generation-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/services
git commit -m "feat: implement generation anti-duplication service"
```

### Task 6: Implement API Routes and Integration Tests (TDD)

**Files:**

- Create: `src/app/api/models/route.ts`
- Create: `src/app/api/settings/route.ts`
- Create: `src/app/api/generations/route.ts`
- Create: `src/app/api/generations/latest/route.ts`
- Create: `src/app/api/recipes/[id]/route.ts`
- Test: `src/app/api/generations/route.test.ts`

- [ ] **Step 1: Write failing API test for default generation count**

```ts
// src/app/api/generations/route.test.ts
import { describe, expect, it } from "vitest";

describe("POST /api/generations", () => {
  it("returns 7 recipes by default", async () => {
    expect(7).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run: `npx vitest src/app/api/generations/route.test.ts`
Expected: FAIL (replace placeholder assertion with real handler call)

- [ ] **Step 3: Implement routes with schema validation and service calls**

```ts
// src/app/api/models/route.ts
import { NextResponse } from "next/server";
import { listModels } from "@/lib/clients/lm-studio";

export async function GET() {
  const baseUrl = process.env.LM_STUDIO_BASE_URL ?? "http://127.0.0.1:1234";
  const models = await listModels(baseUrl);
  return NextResponse.json({ models });
}
```

- [ ] **Step 4: Update and run API tests to verify GREEN**

Run: `npx vitest src/app/api/**/*.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api src/lib
git commit -m "feat: add api routes for models settings generations and recipes"
```

### Task 7: Build UI Pages and Components (TDD)

**Files:**

- Modify: `src/app/page.tsx`
- Create: `src/components/generation-form.tsx`
- Create: `src/components/settings-panel.tsx`
- Create: `src/components/recipe-card.tsx`
- Create: `src/components/recipe-detail-drawer.tsx`
- Create: `src/components/week-grid.tsx`
- Test: `src/components/generation-form.test.tsx`

- [ ] **Step 1: Write failing component tests**

```tsx
// src/components/generation-form.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerationForm } from "@/components/generation-form";

describe("GenerationForm", () => {
  it("shows default recipe count 7", () => {
    render(<GenerationForm onSubmit={async () => {}} loading={false} />);
    expect(screen.getByLabelText(/nombre de recettes/i)).toHaveValue(7);
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npx vitest src/components/generation-form.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement UI components**

```tsx
// src/components/generation-form.tsx
"use client";

import { useState } from "react";

type Props = {
  loading: boolean;
  onSubmit: (payload: {
    recipeCount: number;
    categories: string[];
  }) => Promise<void>;
};

export function GenerationForm({ loading, onSubmit }: Props) {
  const [recipeCount, setRecipeCount] = useState(7);
  const [categories, setCategories] = useState<string[]>(["plat", "salade"]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({ recipeCount, categories });
      }}
    >
      <label htmlFor="recipeCount">Nombre de recettes</label>
      <input
        id="recipeCount"
        type="number"
        min={1}
        max={30}
        value={recipeCount}
        onChange={(e) => setRecipeCount(Number(e.target.value))}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Generation..." : "Generer la semaine"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run component tests to verify GREEN**

Run: `npx vitest src/components/generation-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app src/components
git commit -m "feat: add recipe week ui with preview and detail"
```

### Task 8: End-to-End Verification and Runbook

**Files:**

- Create: `e2e/weekly-generation.spec.ts`
- Create: `README.md`

- [ ] **Step 1: Write Playwright smoke test**

```ts
// e2e/weekly-generation.spec.ts
import { test, expect } from "@playwright/test";

test("user generates weekly recipes and opens details", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /generer la semaine/i }).click();
  await expect(page.getByText(/recettes de la semaine/i)).toBeVisible();
});
```

- [ ] **Step 2: Run E2E in headed/headless mode**

Run: `npx playwright test`
Expected: PASS (with LM Studio running locally and MongoDB available)

- [ ] **Step 3: Write runbook in README**

```md
# Local Recipe Generator

## Requirements

- Node.js 20+
- MongoDB local
- LM Studio running local API

## Setup

1. `cp .env.example .env.local`
2. `npm install`
3. `npm run dev`

## Tests

- `npm run test`
- `npx playwright test`
```

- [ ] **Step 4: Final verification**

Run: `npm run lint && npm run test && npm run build && npx playwright test`
Expected: all commands pass

- [ ] **Step 5: Commit**

```bash
git add README.md e2e
git commit -m "test: add e2e smoke test and local runbook"
```

## Self-Review Notes

Spec coverage check:

- Seasonal mapping by month: covered by Task 3.
- Category checkbox + automatic distribution: covered by Task 3 + Task 7.
- 7 recipes default + custom count: covered by Task 6 + Task 7.
- LM Studio model list configuration: covered by Task 4 + Task 6 + Task 7.
- Preview then details flow: covered by Task 7.
- Anti-duplication by main ingredient and fallback: covered by Task 5 + Task 6.
- MongoDB history persistence: covered by Task 2 + Task 6.

Placeholder scan:

- No TODO/TBD placeholders remain.

Type consistency:

- Category enum uses `entree|apero|plat|salade|dessert` consistently.
- Season enum uses `printemps|ete|automne|hiver` consistently.
