import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { ApiResponse } from './apiResponse.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload options with automatic optimization
const uploadOptions = {
  folder: 'avatars',
  transformation: [
    { width: 300, height: 300, crop: 'limit', quality: 'auto:best' },
    { format: 'webp', quality: 'auto:best' },
  ],
  eager: [
    {
      width: 100,
      height: 100,
      crop: 'thumb',
      gravity: 'face',
      radius: 'max',
      quality: 'auto:best',
    },
    { width: 300, height: 300, crop: 'limit', quality: 'auto:best' },
  ],
  eager_async: true,
  quality_analysis: true,
  invalidate: true,
};

// Upload avatar to Cloudinary
export async function uploadAvatar(file: Buffer, userId: string): Promise<ApiResponse> {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            ...uploadOptions,
            public_id: `user_${userId}_avatar`,
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(file);
    });

    return {
      success: true,
      message: 'Avatar uploaded successfully',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to upload avatar',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// Delete avatar from Cloudinary
export async function deleteAvatar(publicId: string): Promise<ApiResponse> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    if (result.result === 'ok') {
      return {
        success: true,
        message: 'Avatar deleted successfully',
        data: result,
      };
    } else {
      return {
        success: false,
        message: 'Failed to delete avatar',
        errors: [result.result],
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete avatar',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// Get avatar URL with transformations
export function getAvatarUrl(
  publicId: string,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string {
  const transformations = {
    thumbnail: 'w_100,h_100,c_thumb,g_face,r_max,q_auto:best',
    medium: 'w_300,h_300,c_limit,q_auto:best',
    large: 'w_500,h_500,c_limit,q_auto:best',
  };

  return cloudinary.url(publicId, {
    transformation: transformations[size],
    format: 'webp',
    quality: 'auto:best',
  });
}

// Generate a unique filename for avatar
export function generateAvatarFilename(userId: string): string {
  return `user_${userId}_avatar`;
}

// Validate file type for avatar upload
export function isValidAvatarType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimeType);
}

// Validate file size for avatar upload (max 5MB)
export function isValidAvatarSize(size: number): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return size <= maxSize;
}

// Get image dimensions
export async function getImageDimensions(file: Buffer): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          transformation: [{ width: 1, height: 1, crop: 'limit' }],
          quality_analysis: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              width: result?.width || 0,
              height: result?.height || 0,
            });
          }
        }
      )
      .end(file);
  });
}

// Optimize image before upload
export async function optimizeImage(file: Buffer): Promise<Buffer> {
  // This is a placeholder for image optimization
  // In a real implementation, you would use a library like sharp or imagemin
  return file;
}

// Get image metadata
export async function getImageMetadata(file: Buffer): Promise<{
  format: string;
  width: number;
  height: number;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          quality_analysis: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              format: result?.format || '',
              width: result?.width || 0,
              height: result?.height || 0,
              bytes: result?.bytes || 0,
            });
          }
        }
      )
      .end(file);
  });
}
