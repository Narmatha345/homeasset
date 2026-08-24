import { Schema, model, Document, Types } from "mongoose";

export const REQUEST_TYPES = [
  "Repair",
  "Preventive Maintenance",
  "Inspection",
  "Cleaning",
  "Part Replacement",
  "Emergency",
  "Other",
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const SERVICE_ORDER_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type ServiceOrderPriority = (typeof SERVICE_ORDER_PRIORITIES)[number];

export const SERVICE_ORDER_STATUSES = ["Open", "Assigned", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

export interface IServiceOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  serviceOrderNumber: string;
  assetId: Types.ObjectId;
  houseId: Types.ObjectId;
  locationId: Types.ObjectId;
  requestType: RequestType;
  priority: ServiceOrderPriority;
  requestedDate: Date;
  description: string;
  notes?: string;
  status: ServiceOrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const serviceOrderSchema = new Schema<IServiceOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    serviceOrderNumber: { type: String, required: true, unique: true, trim: true },
    assetId: { type: Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    houseId: { type: Schema.Types.ObjectId, ref: "House", required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    requestType: { type: String, enum: REQUEST_TYPES, required: true },
    priority: { type: String, enum: SERVICE_ORDER_PRIORITIES, default: "Medium" },
    requestedDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: SERVICE_ORDER_STATUSES, default: "Open", index: true },
  },
  { timestamps: true }
);

export const ServiceOrder = model<IServiceOrder>("ServiceOrder", serviceOrderSchema);
