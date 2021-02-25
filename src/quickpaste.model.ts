import mongoose, { Schema } from 'mongoose';

interface IQuickpaste {
    img: string;
    username: string;
    comment?: string;
    timestamp?: string;
    size?: string;
    title?: string;
}

const QuickpasteSchema = new Schema({
    img: { type: Schema.Types.String, required: true },
    username: { type: Schema.Types.String, required: true },
    comment: { type: Schema.Types.String, required: true },
    timestamp: { type: Schema.Types.String, required: true },
    size: { type: Schema.Types.String, required: true },
    title: { type: Schema.Types.String, required: true },
});

const QuickpasteModel = mongoose.model("Poll", QuickpasteSchema);

export { IQuickpaste, QuickpasteModel as model, QuickpasteSchema as schema };