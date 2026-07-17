import {
  AuditAction,
  ImageStatus,
  ImageType,
  ImageVisibility,
  StorageProvider,
  VariantType,
} from "@prisma/client";

export interface CreateImageInput {
  userId: string;
  type?: ImageType;
  visibility?: ImageVisibility;
  title?: string;
  description?: string;
  altText?: string;
}

export interface UpdateImageInput {
  title?: string;
  description?: string;
  altText?: string;
  visibility?: ImageVisibility;
  type?: ImageType;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ImageQueryFilters {
  userId: string;
  type?: ImageType;
  status?: ImageStatus;
  visibility?: ImageVisibility;
  albumId?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface ImageDetailDto {
  id: string;
  userId: string;
  type: ImageType;
  status: ImageStatus;
  visibility: ImageVisibility;
  title: string | null;
  description: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  uploadedAt: Date;
  updatedAt: Date;
  metadata: {
    originalName: string;
    mimeType: string;
    fileSizeBytes: number;
    width: number;
    height: number;
    aspectRatio: number;
    dominantColor: string | null;
    publicUrl: string | null;
  } | null;
  variants: Array<{
    variantType: VariantType;
    width: number;
    height: number;
    publicUrl: string | null;
    fileSizeBytes: number;
  }>;
  tags: string[];
}

export interface CreateAuditLogInput {
  imageId: string;
  userId: string;
  action: AuditAction;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export { ImageType, ImageStatus, ImageVisibility, VariantType, StorageProvider, AuditAction };
