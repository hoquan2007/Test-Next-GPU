import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { createStorageDriver } from "../../storage/local.storage";
import { buildUserImagePath } from "../../storage/storage.interface";
import {
  extractImageInfo,
  generateMedium,
  generateThumbnail,
  getExtensionFromMime,
} from "../../utils/image-utils";
import { imageRepository } from "./image.repository";
import { CreateImageDto, ImageQueryDto, UpdateImageDto } from "./image.validator";
import { ImageDetailDto } from "./image.types";

const storage = createStorageDriver();

function toImageDetailDto(image: NonNullable<Awaited<ReturnType<typeof imageRepository.findById>>>): ImageDetailDto {
  return {
    id: image.id,
    userId: image.userId,
    type: image.type,
    status: image.status,
    visibility: image.visibility,
    title: image.title,
    description: image.description,
    altText: image.altText,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
    uploadedAt: image.uploadedAt,
    updatedAt: image.updatedAt,
    metadata: image.metadata
      ? {
          originalName: image.metadata.originalName,
          mimeType: image.metadata.mimeType,
          fileSizeBytes: image.metadata.fileSizeBytes,
          width: image.metadata.width,
          height: image.metadata.height,
          aspectRatio: image.metadata.aspectRatio,
          dominantColor: image.metadata.dominantColor,
          publicUrl: image.metadata.publicUrl,
        }
      : null,
    variants: image.variants.map((v) => ({
      variantType: v.variantType,
      width: v.width,
      height: v.height,
      publicUrl: v.publicUrl,
      fileSizeBytes: v.fileSizeBytes,
    })),
    tags: image.tags.map((t) => t.tag.name),
  };
}

export class ImageService {
  async uploadImage(
    userId: string,
    file: Express.Multer.File,
    dto: CreateImageDto,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<ImageDetailDto> {
    const imageId = uuidv4();
    const extension = getExtensionFromMime(file.mimetype);
    const imageInfo = await extractImageInfo(file.buffer);

    const image = await prisma.userImage.create({
      data: {
        id: imageId,
        userId,
        type: dto.type,
        visibility: dto.visibility,
        title: dto.title,
        description: dto.description,
        altText: dto.altText,
        status: "PROCESSING",
      },
    });

    try {
      const originalPath = buildUserImagePath(userId, imageId, "original", extension);
      const originalResult = await storage.save(file.buffer, originalPath, file.mimetype);

      const [thumbnail, medium] = await Promise.all([
        generateThumbnail(file.buffer),
        generateMedium(file.buffer),
      ]);

      const thumbnailPath = buildUserImagePath(userId, imageId, "thumbnail", thumbnail.extension);
      const mediumPath = buildUserImagePath(userId, imageId, "medium", medium.extension);

      const [thumbnailResult, mediumResult] = await Promise.all([
        storage.save(thumbnail.buffer, thumbnailPath, thumbnail.mimeType),
        storage.save(medium.buffer, mediumPath, medium.mimeType),
      ]);

      await prisma.$transaction([
        prisma.imageMetadata.create({
          data: {
            imageId,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
            width: imageInfo.width,
            height: imageInfo.height,
            aspectRatio: imageInfo.aspectRatio,
            colorSpace: imageInfo.colorSpace,
            hasAlpha: imageInfo.hasAlpha,
            checksumSha256: imageInfo.checksumSha256,
            storagePath: originalResult.storagePath,
            publicUrl: originalResult.publicUrl,
            dominantColor: imageInfo.dominantColor,
          },
        }),
        prisma.imageVariant.createMany({
          data: [
            {
              imageId,
              variantType: "ORIGINAL",
              mimeType: file.mimetype,
              fileSizeBytes: originalResult.fileSizeBytes,
              width: imageInfo.width,
              height: imageInfo.height,
              storagePath: originalResult.storagePath,
              publicUrl: originalResult.publicUrl,
            },
            {
              imageId,
              variantType: "THUMBNAIL",
              mimeType: thumbnail.mimeType,
              fileSizeBytes: thumbnailResult.fileSizeBytes,
              width: thumbnail.width,
              height: thumbnail.height,
              storagePath: thumbnailResult.storagePath,
              publicUrl: thumbnailResult.publicUrl,
              quality: 80,
            },
            {
              imageId,
              variantType: "MEDIUM",
              mimeType: medium.mimeType,
              fileSizeBytes: mediumResult.fileSizeBytes,
              width: medium.width,
              height: medium.height,
              storagePath: mediumResult.storagePath,
              publicUrl: mediumResult.publicUrl,
              quality: 85,
            },
          ],
        }),
        prisma.userImage.update({
          where: { id: imageId },
          data: { status: "READY" },
        }),
      ]);

      if (dto.tags?.length) {
        await this.syncTags(imageId, dto.tags);
      }

      if (dto.type === "AVATAR") {
        await prisma.userProfile.upsert({
          where: { userId },
          create: { userId, avatarId: imageId },
          update: { avatarId: imageId },
        });
      }

      if (dto.type === "COVER") {
        await prisma.userProfile.upsert({
          where: { userId },
          create: { userId, coverId: imageId },
          update: { coverId: imageId },
        });
      }

      await imageRepository.createAuditLog({
        imageId,
        userId,
        action: "UPLOADED",
        details: { originalName: file.originalname, type: dto.type },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });

      const result = await imageRepository.findById(imageId);
      if (!result) throw new AppError(500, "Không thể lấy ảnh sau khi upload");
      return toImageDetailDto(result);
    } catch (error) {
      await prisma.userImage.update({
        where: { id: imageId },
        data: { status: "FAILED" },
      });
      throw error;
    }
  }

  async getImageById(imageId: string, userId: string): Promise<ImageDetailDto> {
    const image = await imageRepository.findById(imageId);
    if (!image) throw new AppError(404, "Không tìm thấy ảnh", "IMAGE_NOT_FOUND");
    if (image.userId !== userId && image.visibility === "PRIVATE") {
      throw new AppError(403, "Không có quyền truy cập ảnh này", "FORBIDDEN");
    }
    return toImageDetailDto(image);
  }

  async listUserImages(userId: string, query: ImageQueryDto) {
    const result = await imageRepository.findMany({ userId, ...query });
    return {
      items: result.items.map(toImageDetailDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async updateImage(imageId: string, userId: string, dto: UpdateImageDto): Promise<ImageDetailDto> {
    const existing = await imageRepository.findById(imageId);
    if (!existing) throw new AppError(404, "Không tìm thấy ảnh", "IMAGE_NOT_FOUND");
    if (existing.userId !== userId) throw new AppError(403, "Không có quyền", "FORBIDDEN");

    await prisma.userImage.update({
      where: { id: imageId },
      data: dto,
    });

    await imageRepository.createAuditLog({
      imageId,
      userId,
      action: "UPDATED",
      details: dto as Record<string, unknown>,
    });

    const updated = await imageRepository.findById(imageId);
    if (!updated) throw new AppError(500, "Cập nhật thất bại");
    return toImageDetailDto(updated);
  }

  async deleteImage(imageId: string, userId: string): Promise<void> {
    const existing = await imageRepository.findById(imageId);
    if (!existing) throw new AppError(404, "Không tìm thấy ảnh", "IMAGE_NOT_FOUND");
    if (existing.userId !== userId) throw new AppError(403, "Không có quyền", "FORBIDDEN");

    await imageRepository.softDelete(imageId);
    await imageRepository.createAuditLog({ imageId, userId, action: "DELETED" });
  }

  private async syncTags(imageId: string, tagNames: string[]): Promise<void> {
    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const tag = await prisma.imageTag.upsert({
        where: { slug },
        create: { name, slug },
        update: {},
      });
      await prisma.imageTagMapping.upsert({
        where: { imageId_tagId: { imageId, tagId: tag.id } },
        create: { imageId, tagId: tag.id },
        update: {},
      });
    }
  }
}

export const imageService = new ImageService();
