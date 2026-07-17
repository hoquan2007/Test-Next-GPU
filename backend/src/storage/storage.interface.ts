export interface StorageResult {
  storagePath: string;
  publicUrl: string;
  fileSizeBytes: number;
}

export interface StorageDriver {
  save(file: Buffer, relativePath: string, mimeType: string): Promise<StorageResult>;
  delete(storagePath: string): Promise<void>;
  getPublicUrl(storagePath: string): string;
}

export interface UploadPaths {
  avatars: string;
  gallery: string;
  covers: string;
  temp: string;
}

export function buildUserImagePath(
  userId: string,
  imageId: string,
  variant: string,
  extension: string
): string {
  return `users/${userId}/images/${imageId}/${variant}.${extension}`;
}

export function buildAvatarPath(userId: string, imageId: string, extension: string): string {
  return `users/${userId}/avatars/${imageId}.${extension}`;
}
