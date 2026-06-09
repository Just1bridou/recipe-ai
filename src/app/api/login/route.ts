import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { getAuthEnv } from "@/lib/env";

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  let password: string;
  try {
    const body = await request.json();
    password = loginSchema.parse(body).password;
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const { APP_SESSION_SECRET } = getAuthEnv();
  const token = await createSessionToken(APP_SESSION_SECRET);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
