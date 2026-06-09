import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(10),
  MONGODB_DB_NAME: z.string().min(1),
  LM_STUDIO_BASE_URL: z.string().url(),
});

export function parseEnv(input: Record<string, string | undefined>) {
  return envSchema.parse(input);
}

export function getEnv() {
  return parseEnv({
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    LM_STUDIO_BASE_URL: process.env.LM_STUDIO_BASE_URL,
  });
}

const authEnvSchema = z.object({
  APP_PASSWORD: z.string().min(1),
  APP_SESSION_SECRET: z.string().min(16),
});

export function parseAuthEnv(input: Record<string, string | undefined>) {
  return authEnvSchema.parse(input);
}

export function getAuthEnv() {
  return parseAuthEnv({
    APP_PASSWORD: process.env.APP_PASSWORD,
    APP_SESSION_SECRET: process.env.APP_SESSION_SECRET,
  });
}

export function getOpenAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY ?? "";
  if (!key) throw new Error("OPENAI_API_KEY manquant dans les variables d'environnement");
  return key;
}
