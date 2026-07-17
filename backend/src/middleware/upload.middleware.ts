import multer from "multer";
import { config, maxFileSizeBytes } from "../config";
import { AppError } from "./error.middleware";

const memoryStorage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: maxFileSizeBytes, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!config.storage.allowedMimeTypes.includes(file.mimetype)) {
      cb(new AppError(400, `Định dạng không hỗ trợ: ${file.mimetype}`, "INVALID_MIME_TYPE"));
      return;
    }
    cb(null, true);
  },
});

export const singleImageUpload = uploadMiddleware.single("image");
export const multiImageUpload = uploadMiddleware.array("images", 10);
