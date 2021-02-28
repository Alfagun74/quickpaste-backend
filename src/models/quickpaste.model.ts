import mongoose, { Schema, Document } from "mongoose";

interface IQuickpaste extends Document{
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    _v?: string;
    img: string;
    username: string;
    comment?: string;
    timestamp?: string;
    size?: number;
    title?: string;
    room: string;
}

const QuickpasteSchema = new Schema({
    img: { type: Schema.Types.String, required: true },
    username: { type: Schema.Types.String, required: true },
    comment: { type: Schema.Types.String, required: false },
    timestamp: { type: Schema.Types.String, required: true },
    size: { type: Schema.Types.Number, required: true },
    title: { type: Schema.Types.String, required: true },
    room: { type: Schema.Types.String, required: true },
});
QuickpasteSchema.set("timestamps", true);

const QuickpasteModel = mongoose.model<IQuickpaste>("Quickpaste", QuickpasteSchema);

export { IQuickpaste, QuickpasteModel, QuickpasteSchema};