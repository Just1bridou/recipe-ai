import mongoose from "mongoose";
import { getEnv } from "@/lib/env";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  const env = getEnv();

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
  });

  isConnected = true;
}
