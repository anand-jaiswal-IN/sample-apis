// API Response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// Success response
export function successResponse<T>(
  message: string,
  data?: T,
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}

// Error response
export function errorResponse(message: string, errors?: string[], data?: unknown): ApiResponse {
  return {
    success: false,
    message,
    errors,
    data,
  };
}

// Paginated response
export function paginatedResponse<T>(
  message: string,
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

// Validation error response
export function validationErrorResponse(errors: string[]): ApiResponse {
  return {
    success: false,
    message: 'Validation failed',
    errors,
  };
}

// Not found response
export function notFoundResponse(message = 'Resource not found'): ApiResponse {
  return {
    success: false,
    message,
  };
}

// Unauthorized response
export function unauthorizedResponse(message = 'Unauthorized'): ApiResponse {
  return {
    success: false,
    message,
  };
}

// Forbidden response
export function forbiddenResponse(message = 'Forbidden'): ApiResponse {
  return {
    success: false,
    message,
  };
}

// Conflict response
export function conflictResponse(message = 'Conflict'): ApiResponse {
  return {
    success: false,
    message,
  };
}

// Too many requests response
export function tooManyRequestsResponse(message = 'Too many requests'): ApiResponse {
  return {
    success: false,
    message,
  };
}

// Internal server error response
export function internalServerErrorResponse(message = 'Internal server error'): ApiResponse {
  return {
    success: false,
    message,
  };
}

// Custom error response
export function customErrorResponse(
  success: boolean,
  message: string,
  data?: unknown,
  errors?: string[],
  meta?: ApiResponse['meta']
): ApiResponse {
  return {
    success,
    message,
    data,
    errors,
    meta,
  };
}
