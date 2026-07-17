import { Request, Response, NextFunction } from "express";
import { paginatedResponse, successResponse } from "../../utils/api-response";
import { AppError } from "../../middleware/error.middleware";
import { imageService } from "./image.service";
import { createImageSchema, imageQuerySchema, updateImageSchema } from "./image.validator";

function getUserId(req: Request): string {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) throw new AppError(401, "Thiếu header x-user-id", "UNAUTHORIZED");
  return userId;
}

export class ImageController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      if (!req.file) throw new AppError(400, "Không có file ảnh", "NO_FILE");

      const dto = createImageSchema.parse(req.body);
      const result = await imageService.uploadImage(userId, req.file, dto, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(successResponse(result, "Upload ảnh thành công"));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const result = await imageService.getImageById(req.params.id, userId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const query = imageQuerySchema.parse(req.query);
      const result = await imageService.listUserImages(userId, query);
      res.json(paginatedResponse(result.items, { page: result.page, limit: result.limit, total: result.total }));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const dto = updateImageSchema.parse(req.body);
      const result = await imageService.updateImage(req.params.id, userId, dto);
      res.json(successResponse(result, "Cập nhật ảnh thành công"));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      await imageService.deleteImage(req.params.id, userId);
      res.json(successResponse(null, "Xóa ảnh thành công"));
    } catch (error) {
      next(error);
    }
  }
}

export const imageController = new ImageController();
