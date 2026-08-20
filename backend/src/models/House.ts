import { Schema, model, Document, Types } from "mongoose";

export interface IHouse extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  address: string;
  city: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const houseSchema = new Schema<IHouse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export const House = model<IHouse>("House", houseSchema);
