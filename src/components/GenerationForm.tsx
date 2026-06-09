"use client";

import { useState } from "react";
import type { Category } from "@/components/types";
import { categoryEmoji, categoryLabels } from "@/components/labels";
import { UserNotesDialog } from "@/components/UserNotesDialog";

type Profile = "equilibre" | "leger" | "equilibre-leger";

interface Props {
  onGenerate: (input: {
    recipeCount: number;
    categories: Category[];
    nutritionProfile: Profile;
    userNotes?: string;
  }) => Promise<void>;
  onConfigure: () => void;
  loading: boolean;
  canGenerate: boolean;
}

const profiles: Array<{ value: Profile; label: string }> = [
  { value: "equilibre-leger", label: "Équilibré + léger" },
  { value: "equilibre", label: "Équilibré" },
  { value: "leger", label: "Léger" },
];

const allCategories = Object.keys(categoryLabels) as Category[];

export function GenerationForm({
  onGenerate,
  onConfigure,
  loading,
  canGenerate,
}: Props) {
  const [recipeCount, setRecipeCount] = useState(7);
  const [nutritionProfile, setNutritionProfile] =
    useState<Profile>("equilibre-leger");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    "plat",
    "salade",
  ]);
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  function toggleCategory(category: Category) {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        const next = prev.filter((item) => item !== category);
        return next.length > 0 ? next : prev;
      }
      return [...prev, category];
    });
  }

  function handleClick() {
    if (!canGenerate) {
      onConfigure();
      return;
    }
    setShowNotesDialog(true);
  }

  function handleNotesConfirm(userNotes: string) {
    setShowNotesDialog(false);
    void onGenerate({
      recipeCount,
      categories: selectedCategories,
      nutritionProfile,
      userNotes: userNotes || undefined,
    });
  }

  function handleNotesCancel() {
    setShowNotesDialog(false);
  }

  return (
    <div className="card">
      <div className="field">
        <span className="field-label">Nombre de recettes</span>
        <div className="stepper">
          <button
            type="button"
            aria-label="Moins"
            disabled={recipeCount <= 1}
            onClick={() => setRecipeCount((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span className="stepper-value">{recipeCount}</span>
          <button
            type="button"
            aria-label="Plus"
            disabled={recipeCount >= 30}
            onClick={() => setRecipeCount((n) => Math.min(30, n + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Profil nutritionnel</span>
        <div className="segmented">
          {profiles.map((p) => (
            <button
              key={p.value}
              type="button"
              className={nutritionProfile === p.value ? "active" : ""}
              onClick={() => setNutritionProfile(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Catégories</span>
        <div className="chips">
          {allCategories.map((category) => {
            const active = selectedCategories.includes(category);
            return (
              <label key={category} className={`chip${active ? " active" : ""}`}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleCategory(category)}
                />
                <span>{categoryEmoji[category]}</span>
                {categoryLabels[category]}
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className={`btn-cta${canGenerate ? "" : " muted"}`}
        disabled={loading}
        onClick={handleClick}
      >
        {loading
          ? "Génération en cours…"
          : canGenerate
            ? "✨ Générer la semaine"
            : "Choisir un modèle"}
      </button>

      <UserNotesDialog
        open={showNotesDialog}
        onConfirm={handleNotesConfirm}
        onCancel={handleNotesCancel}
      />
    </div>
  );
}
