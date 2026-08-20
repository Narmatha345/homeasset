import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { seedDatabase } from "./seed/seed";
import { env } from "./config/env";

async function main() {
  await connectDatabase();
  await seedDatabase();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] HomeAsset API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
