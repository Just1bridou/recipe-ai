import mongoose, { Schema } from "mongoose";

export interface WeeklyGenerationDocument {
  weekKey: string;
  recipeIds: mongoose.Types.ObjectId[];
  filters: {
    categories: string[];
    recipeCount: number;
    nutritionProfile: string;
    seasonMode: "month-based";
  };
  createdAt: Date;
  updatedAt: Date;
}

const weeklyGenerationSchema = new Schema<WeeklyGenerationDocument>(
  {
    weekKey: { type: String, required: true, index: true },
    recipeIds: [{ type: Schema.Types.ObjectId, ref: "Recipe", required: true }],
    filters: {
      categories: [{ type: String, required: true }],
      recipeCount: { type: Number, required: true },
      nutritionProfile: { type: String, required: true },
      seasonMode: { type: String, default: "month-based" },
    },
  },
  { timestamps: true },
);

export const WeeklyGenerationModel =
  (mongoose.models
    .WeeklyGeneration as mongoose.Model<WeeklyGenerationDocument>) ||
  mongoose.model<WeeklyGenerationDocument>(
    "WeeklyGeneration",
    weeklyGenerationSchema,
  );
