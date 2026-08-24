import express from "express";
import cors from "cors";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/authRoutes";
import houseRoutes from "./routes/houseRoutes";
import locationRoutes from "./routes/locationRoutes";
import assetRoutes from "./routes/assetRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import serviceOrderRoutes from "./routes/serviceOrderRoutes";
import maintenanceRoutes from "./routes/maintenanceRoutes";
import brandRoutes from "./routes/brandRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import searchRoutes from "./routes/searchRoutes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/houses", requireAuth, houseRoutes);
  app.use("/api/locations", requireAuth, locationRoutes);
  app.use("/api/assets", requireAuth, assetRoutes);
  app.use("/api/services", requireAuth, serviceRoutes);
  app.use("/api/service-orders", requireAuth, serviceOrderRoutes);
  app.use("/api/maintenance", requireAuth, maintenanceRoutes);
  app.use("/api/brands", requireAuth, brandRoutes);
  app.use("/api/dashboard", requireAuth, dashboardRoutes);
  app.use("/api/search", requireAuth, searchRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
