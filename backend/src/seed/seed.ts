import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { House } from "../models/House";
import { Location } from "../models/Location";
import { Asset } from "../models/Asset";
import { ServiceRecord } from "../models/ServiceRecord";
import { env } from "../config/env";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

export async function seedDatabase(): Promise<void> {
  const existingUser = await User.findOne({ email: env.demoEmail });
  if (existingUser) {
    console.log("[seed] Demo data already present, skipping seed");
    return;
  }

  console.log("[seed] Seeding demo data...");

  const hashedPassword = await bcrypt.hash(env.demoPassword, 10);
  const user = await User.create({
    name: "Demo User",
    email: env.demoEmail,
    password: hashedPassword,
  });

  const house = await House.create({
    userId: user._id,
    name: "My Home",
    address: "123 Example Street",
    city: "Chennai",
    description: "Primary residence",
  });

  const [livingRoom, masterBedroom, kitchen, utilityRoom, bathroom] = await Location.create([
    { houseId: house._id, name: "Living Room", description: "Main living area" },
    { houseId: house._id, name: "Master Bedroom", description: "Primary bedroom" },
    { houseId: house._id, name: "Kitchen", description: "Kitchen and pantry" },
    { houseId: house._id, name: "Utility Room", description: "Laundry and utility" },
    { houseId: house._id, name: "Bathroom", description: "Attached bathroom" },
  ]);

  const assetDefs = [
    {
      name: "LG Split AC",
      assetId: "AST-00001",
      category: "Air Conditioner",
      brand: "LG",
      model: "LS-Q18YNZA",
      serialNumber: "LG-AC-88213",
      status: "Active" as const,
      locationId: masterBedroom._id,
      purchaseDate: monthsAgo(26),
      purchasePrice: 42000,
      warrantyExpiry: daysFromNow(-30),
      maintenanceFrequency: "Every 6 Months" as const,
      lastServiceDate: monthsAgo(2),
      nextServiceDate: daysFromNow(2),
      notes: "Split AC in master bedroom, gas top-up done last service.",
    },
    {
      name: "Samsung Refrigerator",
      assetId: "AST-00002",
      category: "Refrigerator",
      brand: "Samsung",
      model: "RT42B5J58SL",
      serialNumber: "SM-RF-55021",
      status: "Active" as const,
      locationId: kitchen._id,
      purchaseDate: monthsAgo(34),
      purchasePrice: 38500,
      warrantyExpiry: daysFromNow(60),
      maintenanceFrequency: "Yearly" as const,
      lastServiceDate: monthsAgo(9),
      nextServiceDate: daysFromNow(20),
      notes: "Double door frost-free refrigerator.",
    },
    {
      name: "Samsung Washing Machine",
      assetId: "AST-00003",
      category: "Washing Machine",
      brand: "Samsung",
      model: "WA70N4422",
      serialNumber: "SM-WM-77410",
      status: "Under Maintenance" as const,
      locationId: utilityRoom._id,
      purchaseDate: monthsAgo(20),
      purchasePrice: 27000,
      warrantyExpiry: daysFromNow(120),
      maintenanceFrequency: "Every 3 Months" as const,
      lastServiceDate: monthsAgo(3),
      nextServiceDate: daysFromNow(5),
      notes: "Front-load washer, drum noise reported once.",
    },
    {
      name: "Sony Bravia TV",
      assetId: "AST-00004",
      category: "Television",
      brand: "Sony",
      model: "Bravia KD-55X74",
      serialNumber: "SN-TV-33094",
      status: "Active" as const,
      locationId: livingRoom._id,
      purchaseDate: monthsAgo(14),
      purchasePrice: 65000,
      warrantyExpiry: daysFromNow(320),
      maintenanceFrequency: "Yearly" as const,
      lastServiceDate: monthsAgo(1),
      nextServiceDate: daysFromNow(10),
      notes: "55-inch 4K smart TV mounted on wall.",
    },
    {
      name: "Kent Water Purifier",
      assetId: "AST-00005",
      category: "Water Purifier",
      brand: "Kent",
      model: "Grand Plus",
      serialNumber: "KT-WP-12938",
      status: "Active" as const,
      locationId: kitchen._id,
      purchaseDate: monthsAgo(11),
      purchasePrice: 15500,
      warrantyExpiry: daysFromNow(200),
      maintenanceFrequency: "Every 3 Months" as const,
      lastServiceDate: monthsAgo(4),
      nextServiceDate: daysFromNow(-6),
      notes: "RO+UV purifier, filter change overdue.",
    },
    {
      name: "Havells Water Heater",
      assetId: "AST-00006",
      category: "Water Heater",
      brand: "Havells",
      model: "Instanio 3KW",
      serialNumber: "HV-WH-40217",
      status: "Active" as const,
      locationId: bathroom._id,
      purchaseDate: monthsAgo(18),
      purchasePrice: 6500,
      warrantyExpiry: daysFromNow(-10),
      maintenanceFrequency: "Yearly" as const,
      lastServiceDate: monthsAgo(6),
      nextServiceDate: daysFromNow(30),
      notes: "Instant water heater above wash basin.",
    },
  ];

  const assets = await Asset.create(assetDefs.map((a) => ({ ...a, userId: user._id, houseId: house._id })));
  const byName = Object.fromEntries(assets.map((a) => [a.name, a]));

  await ServiceRecord.create([
    {
      assetId: byName["LG Split AC"]._id,
      userId: user._id,
      serviceDate: monthsAgo(2),
      serviceType: "Cleaning",
      serviceProvider: "Demo Service",
      cost: 900,
      description: "General cleaning and filter wash",
      nextServiceDate: daysFromNow(2),
    },
    {
      assetId: byName["LG Split AC"]._id,
      userId: user._id,
      serviceDate: monthsAgo(8),
      serviceType: "Repair",
      serviceProvider: "CoolTech Services",
      cost: 2200,
      description: "Gas check and refill",
      partsReplaced: "None",
    },
    {
      assetId: byName["Samsung Refrigerator"]._id,
      userId: user._id,
      serviceDate: monthsAgo(9),
      serviceType: "Inspection",
      serviceProvider: "Samsung Authorized Service",
      cost: 500,
      description: "Annual inspection and gas pressure check",
      nextServiceDate: daysFromNow(20),
    },
    {
      assetId: byName["Samsung Washing Machine"]._id,
      userId: user._id,
      serviceDate: monthsAgo(3),
      serviceType: "General Maintenance",
      serviceProvider: "Demo Service",
      cost: 650,
      description: "Drum cleaning and motor check",
      nextServiceDate: daysFromNow(5),
    },
    {
      assetId: byName["Sony Bravia TV"]._id,
      userId: user._id,
      serviceDate: monthsAgo(1),
      serviceType: "Cleaning",
      serviceProvider: "Demo Service",
      cost: 300,
      description: "Screen and vent cleaning",
      nextServiceDate: daysFromNow(10),
    },
    {
      assetId: byName["Kent Water Purifier"]._id,
      userId: user._id,
      serviceDate: monthsAgo(4),
      serviceType: "Part Replacement",
      serviceProvider: "Kent RO Care",
      cost: 1200,
      description: "Replaced RO membrane and pre-filter",
      partsReplaced: "RO membrane, pre-filter",
      nextServiceDate: daysFromNow(-6),
    },
    {
      assetId: byName["Havells Water Heater"]._id,
      userId: user._id,
      serviceDate: monthsAgo(6),
      serviceType: "General Maintenance",
      serviceProvider: "Demo Service",
      cost: 400,
      description: "Element and thermostat check",
      nextServiceDate: daysFromNow(30),
    },
    {
      assetId: byName["Samsung Refrigerator"]._id,
      userId: user._id,
      serviceDate: monthsAgo(21),
      serviceType: "Repair",
      serviceProvider: "Samsung Authorized Service",
      cost: 1800,
      description: "Compressor noise fixed",
    },
  ]);

  console.log("[seed] Demo data seeded: 1 house, 5 rooms, 6 assets, 8 service records");
  console.log(`[seed] Demo login -> email: ${env.demoEmail}  password: ${env.demoPassword}`);
}
