/**
 * Single source of truth for which brands are offered for each asset category.
 * Served over the API (GET /api/brands?category=) so the frontend never hardcodes brand lists.
 * Keyed by the same category labels used in ASSET_CATEGORIES on both frontend and backend.
 */
export const CATEGORY_BRANDS: Record<string, string[]> = {
  "Air Conditioner": ["LG", "Samsung", "Daikin", "Voltas", "Panasonic", "Carrier", "Blue Star", "Hitachi"],
  Refrigerator: ["LG", "Samsung", "Whirlpool", "Haier", "Godrej", "Bosch", "Panasonic"],
  "Washing Machine": ["LG", "Samsung", "IFB", "Bosch", "Whirlpool", "Haier"],
  Television: ["Sony", "Samsung", "LG", "OnePlus", "TCL", "Xiaomi", "Panasonic"],
  Microwave: ["LG", "Samsung", "IFB", "Bajaj", "Whirlpool", "Panasonic"],
  "Water Heater": ["Havells", "Bajaj", "AO Smith", "Racold", "V-Guard", "Crompton"],
  Dishwasher: ["Bosch", "IFB", "LG", "Samsung", "Faber", "Whirlpool"],
  "Water Purifier": ["Kent", "Aquaguard", "Pureit", "Livpure", "AO Smith", "Blue Star"],
  Laptop: ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Samsung"],
  Other: [],
};

export function getBrandsForCategory(category?: string): string[] {
  if (!category) return [];
  return CATEGORY_BRANDS[category] || [];
}
