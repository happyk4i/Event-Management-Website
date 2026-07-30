import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = async (
  buffer: Buffer,
  _folder: string,
  _mimetype: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'eventkuy/payment-proofs',
        resource_type: 'image',
        type: 'authenticated',

      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload returned no result'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const deleteImage = async (publicId: string) => {
  try {
    return await cloudinary.uploader.destroy(publicId, { type: 'authenticated' });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary.');
  }
};

export const getSignedUrl = (publicId: string, expiresInSeconds = 3600): string => {
  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    secure: true,
  });
};