"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Connexion impossible");
      }
      const from = searchParams.get("from");
      router.replace(from && from.startsWith("/") ? from : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-full items-center justify-center p-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--r-lg)",
        }}
      >
        <h1 className="text-2xl font-semibold">Recettes IA</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Saisis le mot de passe pour accéder à l&apos;application.
        </p>

        <label htmlFor="password" className="mt-6 block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl px-4 py-3 text-base outline-none"
          style={{
            background: "var(--surface-soft)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
          }}
        />

        {error ? (
          <p className="mt-3 text-sm" style={{ color: "var(--red)" }}>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="mt-6 w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--grad)", borderRadius: "var(--r-sm)" }}
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
