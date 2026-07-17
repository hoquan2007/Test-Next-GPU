import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",

  database: {
    url: process.env.DATABASE_URL ?? "",
  },

  storage: {
    driver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3",
    uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "./uploads"),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? "10", 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES ?? "image/jpeg,image/png,image/webp,image/gif").split(","),
    aws: {
      region: process.env.AWS_REGION ?? "ap-southeast-1",
      bucket: process.env.AWS_S3_BUCKET ?? "",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  },

  imageProcessing: {
    thumbnail: {
      width: parseInt(process.env.THUMBNAIL_WIDTH ?? "200", 10),
      height: parseInt(process.env.THUMBNAIL_HEIGHT ?? "200", 10),
    },
    medium: {
      width: parseInt(process.env.MEDIUM_WIDTH ?? "800", 10),
      height: parseInt(process.env.MEDIUM_HEIGHT ?? "800", 10),
    },
  },
} as const;

export const maxFileSizeBytes = config.storage.maxFileSizeMb * 1024 * 1024;
