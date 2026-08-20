import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  useMemoryDb: (process.env.USE_MEMORY_DB || "true").toLowerCase() !== "false",
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/homeasset",
  demoEmail: process.env.DEMO_EMAIL || "demo@homeasset.com",
  demoPassword: process.env.DEMO_PASSWORD || "Demo@123",
};
