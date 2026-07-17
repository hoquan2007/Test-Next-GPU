import { createApp } from "./app";
import { config } from "./config";
import { connectDatabase, disconnectDatabase } from "./config/database";

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Backend chạy tại http://localhost:${config.port}`);
    console.log(`API prefix: ${config.apiPrefix}`);
  });

  const shutdown = async () => {
    console.log("\nĐang tắt server...");
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Không thể khởi động server:", err);
  process.exit(1);
});
