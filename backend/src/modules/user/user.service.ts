import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

export interface UserWithImagesDto {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  status: string;
  profile: {
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
  } | null;
  imageStats: {
    total: number;
    avatars: number;
    gallery: number;
    covers: number;
  };
}

export class UserService {
  async getUserWithImages(userId: string): Promise<UserWithImagesDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            avatar: { include: { metadata: true } },
            cover: { include: { metadata: true } },
          },
        },
        _count: { select: { images: { where: { deletedAt: null } } } },
      },
    });

    if (!user) throw new AppError(404, "Không tìm thấy user", "USER_NOT_FOUND");

    const [avatars, gallery, covers] = await Promise.all([
      prisma.userImage.count({ where: { userId, type: "AVATAR", deletedAt: null } }),
      prisma.userImage.count({ where: { userId, type: "GALLERY", deletedAt: null } }),
      prisma.userImage.count({ where: { userId, type: "COVER", deletedAt: null } }),
    ]);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      status: user.status,
      profile: user.profile
        ? {
            bio: user.profile.bio,
            avatarUrl: user.profile.avatar?.metadata?.publicUrl ?? null,
            coverUrl: user.profile.cover?.metadata?.publicUrl ?? null,
          }
        : null,
      imageStats: {
        total: user._count.images,
        avatars,
        gallery,
        covers,
      },
    };
  }
}

export const userService = new UserService();
