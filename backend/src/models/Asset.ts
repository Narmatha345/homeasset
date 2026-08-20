import { Schema, model, Document, Types } from "mongoose";

export const ASSET_STATUSES = ["Active", "Under Maintenance", "Inactive", "Retired"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const MAINTENANCE_FREQUENCIES = [
  "Monthly",
  "Every 3 Months",
  "Every 6 Months",
  "Yearly",
  "Custom",
] as const;
export type MaintenanceFrequency = (typeof MAINTENANCE_FREQUENCIES)[number];

export interface IAsset extends Omit<Document, "model"> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  houseId: Types.ObjectId;
  locationId: Types.ObjectId;
  name: string;
  assetId: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  maintenanceFrequency: MaintenanceFrequency;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    houseId: { type: Schema.Types.ObjectId, ref: "House", required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    name: { type: String, required: true, trim: true },
    assetId: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    status: { type: String, enum: ASSET_STATUSES, default: "Active" },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    warrantyExpiry: { type: Date },
    maintenanceFrequency: { type: String, enum: MAINTENANCE_FREQUENCIES, default: "Every 6 Months" },
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

assetSchema.index({ name: "text", brand: "text", model: "text", serialNumber: "text" });

export const Asset = model<IAsset>("Asset", assetSchema);
