import { prisma } from "../../config/database";
import { ImageQueryFilters } from "./image.types";

const imageInclude = {
  metadata: true,
  variants: true,
  tags: { include: { tag: true } },
} as const;

export class ImageRepository {
  async findById(id: string) {
    return prisma.userImage.findFirst({
      where: { id, deletedAt: null },
      include: imageInclude,
    });
  }

  async findMany(filters: ImageQueryFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId: filters.userId,
      deletedAt: null,
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
      ...(filters.visibility && { visibility: filters.visibility }),
      ...(filters.albumId && { albumItems: { some: { albumId: filters.albumId } } }),
      ...(filters.tag && { tags: { some: { tag: { slug: filters.tag } } } }),
    };

    const [items, total] = await Promise.all([
      prisma.userImage.findMany({
        where,
        include: imageInclude,
        orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.userImage.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async softDelete(id: string) {
    return prisma.userImage.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DELETED" },
    });
  }

  async createAuditLog(data: {
    imageId: string;
    userId: string;
    action: import("@prisma/client").AuditAction;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.imageAuditLog.create({ data });
  }
}

export const imageRepository = new ImageRepository();
