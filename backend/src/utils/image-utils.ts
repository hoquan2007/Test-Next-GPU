import crypto from "crypto";
import sharp from "sharp";
import { config } from "../config";

export interface ProcessedImageInfo {
  width: number;
  height: number;
  aspectRatio: number;
  hasAlpha: boolean;
  colorSpace: string;
  dominantColor: string | null;
  checksumSha256: string;
}

export interface ImageVariantOutput {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
  extension: string;
}

export function computeChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function extractImageInfo(buffer: Buffer): Promise<ProcessedImageInfo> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  let dominantColor: string | null = null;
  try {
    const { dominant } = await sharp(buffer).stats();
    dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;
  } catch {
    dominantColor = null;
  }

  return {
    width,
    height,
    aspectRatio: height > 0 ? width / height : 0,
    hasAlpha: metadata.hasAlpha ?? false,
    colorSpace: metadata.space ?? "srgb",
    dominantColor,
    checksumSha256: computeChecksum(buffer),
  };
}

export async function generateThumbnail(buffer: Buffer): Promise<ImageVariantOutput> {
  const { width, height } = config.imageProcessing.thumbnail;
  const output = await sharp(buffer)
    .resize(width, height, { fit: "cover", position: "centre" })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    mimeType: "image/webp",
    extension: "webp",
  };
}

export async function generateMedium(buffer: Buffer): Promise<ImageVariantOutput> {
  const { width, height } = config.imageProcessing.medium;
  const output = await sharp(buffer)
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    mimeType: "image/webp",
    extension: "webp",
  };
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] ?? "bin";
}
