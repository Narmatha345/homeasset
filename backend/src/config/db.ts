import mongoose from "mongoose";
import { env } from "./env";

let memoryServer: import("mongodb-memory-server").MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  let uri = env.mongodbUri;

  if (env.useMemoryDb) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "homeasset" },
      // mongodb-memory-server defaults to MongoDB 6.0.x, but MongoDB only
      // ships binaries for Debian 12+ (used by Render's Node runtime, among
      // others) starting at 7.0.3 - pin to a compatible 7.0.x release.
      binary: { version: "7.0.14" },
    });
    uri = memoryServer.getUri("homeasset");
    console.log("[db] Started in-memory MongoDB instance for this session");
  }

  await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB (${env.useMemoryDb ? "in-memory" : "external"})`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
