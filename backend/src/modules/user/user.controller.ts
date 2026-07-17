import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/api-response";
import { AppError } from "../../middleware/error.middleware";
import { userService } from "./user.service";

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.headers["x-user-id"] as string | undefined;
      if (!userId) throw new AppError(401, "Thiếu header x-user-id", "UNAUTHORIZED");

      const result = await userService.getUserWithImages(userId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
