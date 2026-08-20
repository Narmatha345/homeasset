import { Schema, model, Document, Types } from "mongoose";

export interface ILocation extends Document {
  _id: Types.ObjectId;
  houseId: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    houseId: { type: Schema.Types.ObjectId, ref: "House", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Location = model<ILocation>("Location", locationSchema);
