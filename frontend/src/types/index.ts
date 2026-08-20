export interface User {
  id: string;
  name: string;
  email: string;
}

export interface House {
  _id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  _id: string;
  houseId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssetStatus = "Active" | "Under Maintenance" | "Inactive" | "Retired";

export type MaintenanceFrequency = "Monthly" | "Every 3 Months" | "Every 6 Months" | "Yearly" | "Custom";

export interface Asset {
  _id: string;
  userId: string;
  houseId: string | { _id: string; name: string };
  locationId: string | { _id: string; name: string };
  name: string;
  assetId: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  maintenanceFrequency: MaintenanceFrequency;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceType = "General Maintenance" | "Cleaning" | "Inspection" | "Repair" | "Part Replacement" | "Other";

export interface ServiceRecord {
  _id: string;
  assetId: string | Asset;
  userId: string;
  serviceDate: string;
  serviceType: ServiceType;
  serviceProvider?: string;
  cost?: number;
  description?: string;
  partsReplaced?: string;
  nextServiceDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceStatus = "Overdue" | "Due Soon" | "Scheduled" | "Upcoming" | "Completed";
export type MaintenancePriority = "High" | "Medium" | "Low";

export interface UpcomingMaintenanceItem {
  assetId: string;
  assetName: string;
  assetCode: string;
  location: string;
  house: string;
  maintenanceType: string;
  dueDate: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
}

export interface DashboardSummary {
  totalAssets: number;
  activeAssets: number;
  servicesDueThisMonth: number;
  overdueServices: number;
}

export interface AppNotification {
  id: string;
  message: string;
  type: "overdue" | "due-soon" | "warranty";
  createdAt: string;
}

export interface LocationTreeNode {
  house: House;
  locations: {
    location: Location;
    assets: Asset[];
  }[];
}
