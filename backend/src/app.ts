import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static(path.resolve(config.storage.uploadDir)));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(config.apiPrefix, routes);

  app.use(errorHandler);

  return app;
}
