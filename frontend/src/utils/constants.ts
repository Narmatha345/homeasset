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
