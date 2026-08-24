export const ASSET_CATEGORIES = [
  "Air Conditioner",
  "Refrigerator",
  "Washing Machine",
  "Television",
  "Microwave",
  "Water Heater",
  "Dishwasher",
  "Laptop",
  "Water Purifier",
  "Other",
];

export const ASSET_STATUSES = ["Active", "Under Maintenance", "Inactive", "Retired"] as const;

export const MAINTENANCE_FREQUENCIES = ["Monthly", "Every 3 Months", "Every 6 Months", "Yearly", "Custom"] as const;

export const SERVICE_TYPES = [
  "General Maintenance",
  "Cleaning",
  "Inspection",
  "Repair",
  "Part Replacement",
  "Other",
] as const;

export const MAINTENANCE_STATUSES = ["Overdue", "Due Soon", "Scheduled", "Upcoming"] as const;

export const REQUEST_TYPES = [
  "Repair",
  "Preventive Maintenance",
  "Inspection",
  "Cleaning",
  "Part Replacement",
  "Emergency",
  "Other",
] as const;

export const SERVICE_ORDER_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

export const SERVICE_ORDER_STATUSES = ["Open", "Assigned", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
