"use client";

import { useEffect, useState } from "react";
import { GenerationForm } from "@/components/GenerationForm";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeDetail } from "@/components/RecipeDetail";
import { BottomSheet } from "@/components/BottomSheet";
import { shortModelName } from "@/components/labels";
import type {
  Category,
  RecipeDetailData,
  RecipePreview,
} from "@/components/types";

type LmStatus = "checking" | "online" | "offline";
type Provider = "chatgpt" | "lm-studio";

function LmStudioUrlField({
  value,
  onSave,
}: {
  value: string;
  onSave: (url: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleBlur() {
    if (draft !== value) onSave(draft);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label
        className="field-label"
        htmlFor="lm-url"
        style={{ display: "block", marginBottom: "0.4rem" }}
      >
        URL LM Studio
      </label>
      <input
        id="lm-url"
        type="url"
        value={draft}
        placeholder="http://127.0.0.1:1234"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full rounded-xl px-4 py-2 text-sm outline-none"
        style={{
          background: "var(--surface-soft)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          color: "var(--text)",
        }}
      />
      <small style={{ color: "var(--muted)" }}>
        Laisse vide pour utiliser la valeur par défaut de{" "}
        <code>LM_STUDIO_BASE_URL</code>
      </small>
    </div>
  );
}

interface Model {
  id: string;
  name: string;
}

export default function Home() {
  const [provider, setProvider] = useState<Provider>("chatgpt");
  const [lmStudioUrl, setLmStudioUrl] = useState("");
  const [lmStatus, setLmStatus] = useState<LmStatus>("checking");
  const [lmError, setLmError] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weekKey, setWeekKey] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetailData | null>(
    null,
  );

  async function checkLmStudio(url?: string) {
    setLmStatus("checking");
    setLmError("");
    try {
      const target = url ?? lmStudioUrl;
      const query = target ? `?url=${encodeURIComponent(target)}` : "";
      const res = await fetch(`/api/models${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "LM Studio indisponible");
      setModels(data.models ?? []);
      setLmStatus("online");
    } catch (err) {
      setLmStatus("offline");
      setLmError(err instanceof Error ? err.message : "LM Studio indisponible");
      setModels([]);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        if (data.settings.provider) setProvider(data.settings.provider);
        if (data.settings.modelId) setSelectedModel(data.settings.modelId);
        if (data.settings.lmStudioUrl)
          setLmStudioUrl(data.settings.lmStudioUrl);
      }
    } catch {
      // silent — settings are best-effort
    }
  }

  async function selectProvider(p: Provider) {
    setProvider(p);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: p }),
      });
    } catch {
      // best-effort save
    }
  }

  async function saveLmStudioUrl(url: string) {
    setLmStudioUrl(url);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lmStudioUrl: url }),
      });
    } catch {
      // best-effort save
    }
    void checkLmStudio(url);
  }

  async function selectModel(modelId: string) {
    setSelectedModel(modelId);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });
    } catch {
      // best-effort save
    }
  }

  async function loadLatest() {
    try {
      const res = await fetch("/api/generations/latest", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Impossible de charger la semaine");
      setWeekKey(data.weekKey ?? null);
      setRecipes(data.recipes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void checkLmStudio();
      void loadSettings();
      void loadLatest();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  async function generate(input: {
    recipeCount: number;
    categories: Category[];
    nutritionProfile: "equilibre" | "leger" | "equilibre-leger";
    userNotes?: string;
  }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Génération impossible");
      setWeekKey(data.weekKey ?? null);
      setRecipes(data.recipes ?? []);
      setSelectedRecipe(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur génération");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/recipes/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Impossible de charger le détail");
      setSelectedRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur détail");
    }
  }

  const canGenerate =
    provider === "chatgpt" || (lmStatus === "online" && !!selectedModel);

  const chipLabel =
    provider === "chatgpt"
      ? "ChatGPT · gpt-4.1-nano"
      : lmStatus === "checking"
        ? "Connexion…"
        : lmStatus === "offline"
          ? "LM Studio hors ligne"
          : selectedModel
            ? shortModelName(selectedModel)
            : "Choisir un modèle";

  return (
    <div className="app">
      <header className="appbar">
        <div className="appbar-brand">
          <span className="appbar-logo">🍳</span>
          <span>Recettes&nbsp;IA</span>
        </div>
        <button
          type="button"
          className="status-chip"
          onClick={() => setSettingsOpen(true)}
        >
          <span className={`dot ${lmStatus}`} />
          <span className="status-chip-label">{chipLabel}</span>
        </button>
      </header>

      <main className="content">
        <section className="hero">
          <h1>Recettes de saison</h1>
          <p>Fraîches, savoureuses et générées par ton modèle local.</p>
        </section>

        {lmStatus === "offline" && (
          <div className="banner banner-error">
            <span className="banner-icon">⚠️</span>
            <span>LM Studio est hors ligne.</span>
            <button type="button" onClick={() => void checkLmStudio()}>
              Réessayer
            </button>
          </div>
        )}

        {lmStatus === "online" && !selectedModel && (
          <div className="banner banner-warn">
            <span className="banner-icon">💡</span>
            <span>Choisis un modèle pour commencer.</span>
            <button type="button" onClick={() => setSettingsOpen(true)}>
              Ouvrir
            </button>
          </div>
        )}

        <GenerationForm
          loading={loading}
          canGenerate={canGenerate}
          onGenerate={generate}
          onConfigure={() => setSettingsOpen(true)}
        />

        {error ? (
          <div className="banner banner-error" style={{ marginTop: "1rem" }}>
            <span className="banner-icon">⚠️</span>
            <span>{error}</span>
          </div>
        ) : null}

        <section className="results">
          <div className="results-head">
            <h2>{weekKey ? `Semaine ${weekKey}` : "Mes recettes"}</h2>
            {recipes.length > 0 && (
              <span className="results-count">
                {recipes.length} recette{recipes.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {recipes.length > 0 ? (
            <div className="recipe-list">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onOpen={openDetail}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="empty-emoji">🥘</div>
              <p>Aucune recette pour l’instant.</p>
              <p>Lance une génération pour remplir ta semaine.</p>
            </div>
          )}
        </section>
      </main>

      {/* Settings / model picker */}
      <BottomSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Modèle IA"
      >
        <div className="segmented" style={{ marginBottom: "1rem" }}>
          {(["chatgpt", "lm-studio"] as Provider[]).map((p) => (
            <button
              key={p}
              type="button"
              className={provider === p ? "active" : ""}
              onClick={() => void selectProvider(p)}
            >
              {p === "chatgpt" ? "ChatGPT" : "LM Studio"}
            </button>
          ))}
        </div>

        {provider === "chatgpt" && (
          <div className="status-row">
            <span className="dot online" />
            <div>
              <span>gpt-4.1-nano</span>
              <small style={{ display: "block" }}>
                Clé API lue depuis <code>OPENAI_API_KEY</code>
              </small>
            </div>
          </div>
        )}

        {provider === "lm-studio" && (
          <>
            <LmStudioUrlField value={lmStudioUrl} onSave={saveLmStudioUrl} />

            <div className="status-row">
              <span className={`dot ${lmStatus}`} />
              <div>
                {lmStatus === "online" && "Connecté à LM Studio"}
                {lmStatus === "checking" && "Connexion en cours…"}
                {lmStatus === "offline" && "LM Studio hors ligne"}
                {lmStatus === "offline" && lmError ? (
                  <small>{lmError}</small>
                ) : null}
              </div>
            </div>

            {lmStatus === "online" && models.length > 0 && (
              <div className="model-list">
                {models.map((m) => {
                  const selected = m.id === selectedModel;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`model-row${selected ? " selected" : ""}`}
                      onClick={() => void selectModel(m.id)}
                    >
                      <span className="model-radio" />
                      <span className="model-name">
                        {shortModelName(m.name)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {lmStatus === "online" && models.length === 0 && (
              <p className="sheet-hint">
                Aucun modèle chargé dans LM Studio. Charge un modèle puis
                actualise.
              </p>
            )}

            {lmStatus !== "online" && (
              <button
                type="button"
                className="sheet-retry"
                onClick={() => void checkLmStudio()}
              >
                ↺ Réessayer la connexion
              </button>
            )}
          </>
        )}
      </BottomSheet>

      {/* Recipe detail */}
      <BottomSheet
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      >
        {selectedRecipe ? <RecipeDetail recipe={selectedRecipe} /> : null}
      </BottomSheet>
    </div>
  );
}
