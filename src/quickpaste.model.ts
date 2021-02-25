import mongoose, { Schema } from "mongoose";

interface IQuickpaste {
    img: string;
    username: string;
    comment?: string;
    timestamp?: string;
    size?: string;
    title?: string;
    channel: string;
}

const QuickpasteSchema = new Schema({
  img: { type: Schema.Types.String, required: true },
  username: { type: Schema.Types.String, required: true },
  comment: { type: Schema.Types.String, required: false },
  timestamp: { type: Schema.Types.String, required: true },
  size: { type: Schema.Types.String, required: true },
  title: { type: Schema.Types.String, required: true },
  channel: { type: Schema.Types.String, required: true },
});
QuickpasteSchema.set("timestamps", true);

const QuickpasteModel = mongoose.model("Quickpaste", QuickpasteSchema);

export { IQuickpaste, QuickpasteModel, QuickpasteSchema};