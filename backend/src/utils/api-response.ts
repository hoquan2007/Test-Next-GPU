export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: { code: string; details?: unknown };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function paginatedResponse<T>(
  data: T[],
  meta: { page: number; limit: number; total: number }
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  };
}
