import { Storage, Bucket } from '@google-cloud/storage';
import sharp from 'sharp';
import { env } from '../config/env';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generatePhotoId } from '../utils/nanoid';
import { AppError } from '../middlewares/error.middleware';

export interface UploadedPhoto {
  path: string;
  thumbnailPath: string;
  url: string;
  thumbnailUrl: string;
}

export interface StoragePhoto {
  path: string;
  thumbnailPath?: string;
}

interface ProcessedPhoto {
  full: Buffer;
  thumbnail: Buffer;
}

const ALLOWED_IMAGE_FORMATS = new Set(['jpeg', 'png', 'webp']);

const FULL_SIZE = 1600;
const THUMBNAIL_SIZE = 500;

class StorageService {
  private readonly watermarkPath = path.join(__dirname, '../assets/watermark.png');
  private watermarkBuffer?: Buffer;
  private readonly storage: Storage;
  private readonly bucket: Bucket;

  constructor() {
    this.storage = new Storage({
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: env.GOOGLE_CLOUD_CREDENTIALS,
    });

    this.bucket = this.storage.bucket(env.GOOGLE_CLOUD_STORAGE_BUCKET);
  }

  private async getWatermarkBuffer(): Promise<Buffer> {
    if (!this.watermarkBuffer) {
      try {
        this.watermarkBuffer = await fs.readFile(this.watermarkPath);
      } catch {
        throw new Error(`Watermark file not found: ${this.watermarkPath}`);
      }
    }

    return this.watermarkBuffer;
  }

  /**
   * Ajusta el watermark al 25% del ancho de la imagen.
   *
   * También evita que el watermark sea más grande que la imagen.
   */
  private async resizeWatermark(imageWidth: number): Promise<Buffer> {
    const watermarkWidth = Math.max(1, Math.round(imageWidth * 0.25));

    const watermarkBuffer = await this.getWatermarkBuffer();

    return sharp(watermarkBuffer)
      .resize({
        width: watermarkWidth,
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
  }

  /**
   * Valida y genera:
   *
   * - imagen completa 1600px
   * - thumbnail 500px
   * - watermark en ambas
   * - WebP comprimido
   */
  private async processPhoto(buffer: Buffer): Promise<ProcessedPhoto> {
    const image = sharp(buffer, {
      limitInputPixels: 25_000_000,
    });

    const metadata = await image.metadata();

    if (!metadata.format) {
      throw new AppError('Invalid image file', 400);
    }

    if (!ALLOWED_IMAGE_FORMATS.has(metadata.format)) {
      throw new AppError('Only JPEG, PNG and WebP images are allowed', 400);
    }

    // ---------------------------------------------------------
    // FULL IMAGE
    // ---------------------------------------------------------

    const fullBase = await sharp(buffer)
      .rotate()
      .resize({
        width: FULL_SIZE,
        height: FULL_SIZE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();

    const fullMetadata = await sharp(fullBase).metadata();

    const fullWidth = fullMetadata.width ?? FULL_SIZE;

    const fullWatermark = await this.resizeWatermark(fullWidth);

    const full = await sharp(fullBase)
      .composite([
        {
          input: fullWatermark,
          gravity: 'southeast',
        },
      ])
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();

    // ---------------------------------------------------------
    // THUMBNAIL
    // ---------------------------------------------------------

    const thumbnailBase = await sharp(buffer)
      .rotate()
      .resize({
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();

    const thumbnailMetadata = await sharp(thumbnailBase).metadata();

    const thumbnailWidth = thumbnailMetadata.width ?? THUMBNAIL_SIZE;

    const thumbnailWatermark = await this.resizeWatermark(thumbnailWidth);

    const thumbnail = await sharp(thumbnailBase)
      .composite([
        {
          input: thumbnailWatermark,
          gravity: 'southeast',
        },
      ])
      .webp({
        quality: 78,
        effort: 4,
      })
      .toBuffer();

    return {
      full,
      thumbnail,
    };
  }

  /**
   * Procesa y sube una foto completa + thumbnail.
   */
  async uploadGuestPhoto(guestId: string, file: Express.Multer.File): Promise<UploadedPhoto> {
    const processed = await this.processPhoto(file.buffer);

    const photoId = generatePhotoId();

    const fullPath = `guests/${guestId}/${photoId}.webp`;
    const thumbnailPath = `guests/${guestId}/${photoId}-thumb.webp`;

    const fullFile = this.bucket.file(fullPath);
    const thumbnailFile = this.bucket.file(thumbnailPath);

    try {
      await Promise.all([
        fullFile.save(processed.full, {
          metadata: {
            contentType: 'image/webp',
            cacheControl: 'private, max-age=31536000',
          },
          resumable: false,
        }),

        thumbnailFile.save(processed.thumbnail, {
          metadata: {
            contentType: 'image/webp',
            cacheControl: 'private, max-age=31536000',
          },
          resumable: false,
        }),
      ]);
    } catch (error) {
      await Promise.allSettled([
        fullFile.delete({
          ignoreNotFound: true,
        }),

        thumbnailFile.delete({
          ignoreNotFound: true,
        }),
      ]);

      throw error;
    }

    return {
      path: fullPath,
      thumbnailPath,
      url: '',
      thumbnailUrl: '',
    };
  }

  /**
   * Sube múltiples fotos.
   *
   * Si falla una:
   * elimina todas las que ya se habían subido.
   */
  async uploadGuestPhotos(guestId: string, files: Express.Multer.File[]): Promise<UploadedPhoto[]> {
    if (files.length > 5) {
      throw new Error('A guest can have a maximum of 5 photos');
    }

    const uploaded: UploadedPhoto[] = [];

    try {
      for (const file of files) {
        const photo = await this.uploadGuestPhoto(guestId, file);

        uploaded.push(photo);
      }

      return uploaded;
    } catch (error) {
      await this.deleteGuestPhotos(uploaded);

      throw error;
    }
  }

  /**
   * Elimina fotos de GCS.
   *
   * thumbnailPath es opcional para soportar
   * fotos legacy.
   */
  async deleteGuestPhotos(photos: StoragePhoto[]): Promise<void> {
    if (!photos.length) {
      return;
    }

    const paths = photos.flatMap((photo) => {
      if (photo.thumbnailPath) {
        return [photo.path, photo.thumbnailPath];
      }

      return [photo.path];
    });

    await Promise.allSettled(
      paths.map((path) =>
        this.bucket.file(path).delete({
          ignoreNotFound: true,
        })
      )
    );
  }

  /**
   * Elimina una sola foto y su thumbnail.
   */
  async deletePhoto(photo: StoragePhoto): Promise<void> {
    await this.deleteGuestPhotos([photo]);
  }

  async getSignedUrl(filePath: string): Promise<string> {
    const [url] = await this.bucket.file(filePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });

    return url;
  }

  async getSignedUrls(filePaths: string[]): Promise<string[]> {
    return Promise.all(filePaths.map((filePath) => this.getSignedUrl(filePath)));
  }
}

export const storageService = new StorageService();
