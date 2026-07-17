import { z } from "zod";

export const createImageSchema = z.object({
  type: z.enum(["AVATAR", "COVER", "GALLERY", "DOCUMENT", "ID_VERIFICATION"]).default("GALLERY"),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FRIENDS_ONLY", "UNLISTED"]).default("PRIVATE"),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  altText: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateImageSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  altText: z.string().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FRIENDS_ONLY", "UNLISTED"]).optional(),
  type: z.enum(["AVATAR", "COVER", "GALLERY", "DOCUMENT", "ID_VERIFICATION"]).optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const imageQuerySchema = z.object({
  type: z.enum(["AVATAR", "COVER", "GALLERY", "DOCUMENT", "ID_VERIFICATION"]).optional(),
  status: z.enum(["UPLOADING", "PROCESSING", "READY", "FAILED", "DELETED"]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FRIENDS_ONLY", "UNLISTED"]).optional(),
  albumId: z.string().uuid().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateImageDto = z.infer<typeof createImageSchema>;
export type UpdateImageDto = z.infer<typeof updateImageSchema>;
export type ImageQueryDto = z.infer<typeof imageQuerySchema>;
