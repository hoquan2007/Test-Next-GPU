import { Router } from "express";
import { imageController } from "../modules/image/image.controller";
import { userController } from "../modules/user/user.controller";
import { singleImageUpload } from "../middleware/upload.middleware";

const router = Router();

// User
router.get("/users/me", (req, res, next) => userController.getProfile(req, res, next));

// Images
router.post("/users/me/images", singleImageUpload, (req, res, next) => imageController.upload(req, res, next));
router.get("/users/me/images", (req, res, next) => imageController.list(req, res, next));
router.get("/users/me/images/:id", (req, res, next) => imageController.getById(req, res, next));
router.patch("/users/me/images/:id", (req, res, next) => imageController.update(req, res, next));
router.delete("/users/me/images/:id", (req, res, next) => imageController.remove(req, res, next));

export default router;
