import mongoose, { Schema } from "mongoose";

export interface SettingDocument {
  provider: "chatgpt" | "lm-studio";
  modelId: string;
  lmStudioUrl: string;
  defaultRecipeCount: number;
  defaultNutritionProfile: "equilibre" | "leger" | "equilibre-leger";
  updatedAt: Date;
  createdAt: Date;
}

const settingSchema = new Schema<SettingDocument>(
  {
    provider: { type: String, enum: ["chatgpt", "lm-studio"], default: "chatgpt" },
    modelId: { type: String, default: "" },
    lmStudioUrl: { type: String, default: "" },
    defaultRecipeCount: { type: Number, default: 7 },
    defaultNutritionProfile: {
      type: String,
      enum: ["equilibre", "leger", "equilibre-leger"],
      default: "equilibre-leger",
    },
  },
  { timestamps: true },
);

export const SettingModel =
  (mongoose.models.Setting as mongoose.Model<SettingDocument>) ||
  mongoose.model<SettingDocument>("Setting", settingSchema);
