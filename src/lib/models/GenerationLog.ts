import mongoose, { Schema } from "mongoose";

export interface GenerationLogDocument {
  requestPrompt: string;
  rawModelResponse: string;
  parseStatus: "success" | "partial" | "failed";
  errorMessages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const generationLogSchema = new Schema<GenerationLogDocument>(
  {
    requestPrompt: { type: String, default: "" },
    rawModelResponse: { type: String, default: "" },
    parseStatus: {
      type: String,
      enum: ["success", "partial", "failed"],
      required: true,
    },
    errorMessages: [{ type: String }],
  },
  { timestamps: true },
);

export const GenerationLogModel =
  (mongoose.models.GenerationLog as mongoose.Model<GenerationLogDocument>) ||
  mongoose.model<GenerationLogDocument>("GenerationLog", generationLogSchema);
