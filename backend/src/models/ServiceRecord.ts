import { Schema, model, Document, Types } from "mongoose";

export const SERVICE_TYPES = [
  "General Maintenance",
  "Cleaning",
  "Inspection",
  "Repair",
  "Part Replacement",
  "Other",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export interface IServiceRecord extends Document {
  _id: Types.ObjectId;
  assetId: Types.ObjectId;
  serviceOrderId?: Types.ObjectId;
  userId: Types.ObjectId;
  serviceDate: Date;
  serviceType: ServiceType;
  serviceProvider?: string;
  cost?: number;
  description?: string;
  partsReplaced?: string;
  nextServiceDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceRecordSchema = new Schema<IServiceRecord>(
  {
    assetId: { type: Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    serviceOrderId: { type: Schema.Types.ObjectId, ref: "ServiceOrder", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    serviceDate: { type: Date, required: true },
    serviceType: { type: String, enum: SERVICE_TYPES, required: true },
    serviceProvider: { type: String, trim: true },
    cost: { type: Number },
    description: { type: String, trim: true },
    partsReplaced: { type: String, trim: true },
    nextServiceDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const ServiceRecord = model<IServiceRecord>("ServiceRecord", serviceRecordSchema);
