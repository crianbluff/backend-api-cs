import { FilterQuery, HydratedDocument, Model } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { GuestDocument, GuestListItem, SoloListItem, GroupListItem, GroupMemberListItem } from '../types/guest.types';
import { UpdateGuestInput, GuestQueryInput } from '../utils/validation';
import { generateGuestId } from '../utils/nanoid';
import { PaginatedResponse } from '../types/api-response.types';
import { buildVisitedDateFilter, parsePagination } from '../utils/api-response';
import { storageService, UploadedPhoto } from './storage.service';
import { AppError } from '../middlewares/error.middleware';

// ─── Mongoose types ──────────────────────────────────────────────────────────
export type GuestDoc = HydratedDocument<IGuestDocument>;
export type GuestLean = GuestDocument;

// ─── Mappers ─────────────────────────────────────────────────────────────────
function toMember(doc: GuestLean): GroupMemberListItem {
  return {
    guestId: doc.guestId,

    // Visit info
    hangOut: doc.hangOut,
    gift: doc.gift,
    comments: doc.comments,
    isFirstTime: doc.isFirstTime,
    ambassador: doc.ambassador,
    didTheyReq: doc.didTheyReq,

    // Personal info
    fullName: doc.fullName,
    hometownCode: doc.hometownCode,
    countryCodeWeMet: doc.countryCodeWeMet,
    livingInCode: doc.livingInCode,
    prefixCode: doc.prefixCode,
    continent: doc.continent,
    region: doc.region,
    birthDate: doc.birthDate,
    occupation: doc.occupation,
    hometown: doc.hometown,
    livingIn: doc.livingIn,
    cityWeMet: doc.cityWeMet,
    locationWeMet: doc.locationWeMet,
    rating: doc.rating,
    gender: doc.gender,
    isGay: doc.isGay,
    theirReference: doc.theirReference,
    myReference: doc.myReference,
    whatsapp: doc.whatsapp,
    instagram: doc.instagram,
    urlProfileCs: doc.urlProfileCs,

    photos: doc.photos,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toSolo(doc: GuestLean): SoloListItem {
  return {
    guestId: doc.guestId,
    groupType: 'solo',

    // Visit info
    isFirstTime: doc.isFirstTime,
    ambassador: doc.ambassador,
    didTheyReq: doc.didTheyReq,
    nights: doc.nights,
    stayed: doc.stayed,
    visitedDate: doc.visitedDate,
    hangOut: doc.hangOut,

    // Personal info
    fullName: doc.fullName,
    hometownCode: doc.hometownCode,
    countryCodeWeMet: doc.countryCodeWeMet,
    livingInCode: doc.livingInCode,
    prefixCode: doc.prefixCode,
    continent: doc.continent,
    region: doc.region,
    birthDate: doc.birthDate,
    occupation: doc.occupation,
    livingIn: doc.livingIn,
    cityWeMet: doc.cityWeMet,
    locationWeMet: doc.locationWeMet,
    hometown: doc.hometown,
    rating: doc.rating,
    gender: doc.gender,
    isGay: doc.isGay,
    theirReference: doc.theirReference,
    myReference: doc.myReference,
    whatsapp: doc.whatsapp,
    urlProfileCs: doc.urlProfileCs,

    // Photos
    photos: doc.photos,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// ─── Filters ─────────────────────────────────────────────────────────────────
function buildFilter(query: GuestQueryInput): FilterQuery<IGuestDocument> {
  const filter: FilterQuery<IGuestDocument> = {};

  if (query.continent) filter.continent = query.continent;
  if (query.region) filter.region = query.region;
  if (query.country) filter.hometownCode = query.country;
  if (query.countryCodeWeMet) filter.countryCodeWeMet = query.countryCodeWeMet;
  if (query.gender) filter.gender = query.gender;

  if (query.groupType === 'solo') {
    filter.groupId = null;
  } else if (query.groupType) {
    filter.groupType = query.groupType;
  }

  if (query.gay !== undefined) filter.isGay = query.gay === 'true';
  if (query.isFirstTime !== undefined) filter.isFirstTime = query.isFirstTime === 'true';
  if (query.ambassador !== undefined) filter.ambassador = query.ambassador === 'true';
  if (query.hangOut !== undefined) filter.hangOut = query.hangOut === 'true';
  if (query.didTheyReq !== undefined) filter.didTheyReq = query.didTheyReq === 'true';
  if (query.rating !== undefined) filter.rating = Number(query.rating);
  Object.assign(filter, buildVisitedDateFilter(query.from, query.to));

  return filter;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class GuestService {
  constructor(protected readonly model: Model<IGuestDocument>) {}

  private async addSignedUrls(doc: GuestLean): Promise<GuestLean> {
    if (!doc.photos?.length) {
      return doc;
    }

    return {
      ...doc,

      photos: await Promise.all(
        doc.photos.map(async (photo) => {
          const url = await storageService.getSignedUrl(photo.path);

          const thumbnailUrl = photo.thumbnailPath ? await storageService.getSignedUrl(photo.thumbnailPath) : url;

          return {
            ...photo,
            url,
            thumbnailUrl,
          };
        })
      ),
    };
  }

  private async addPhotoUrls(guest: GuestLean): Promise<GuestLean> {
    if (!guest.photos?.length) {
      return guest;
    }

    guest.photos = await Promise.all(
      guest.photos.map(async (photo) => {
        const url = await storageService.getSignedUrl(photo.path);

        const thumbnailUrl = photo.thumbnailPath ? await storageService.getSignedUrl(photo.thumbnailPath) : url;

        return {
          ...photo,
          url,
          thumbnailUrl,
        };
      })
    );

    return guest;
  }

  async findAll(query: GuestQueryInput): Promise<PaginatedResponse<GuestListItem>> {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildFilter(query);

    const [result] = await this.model
      .aggregate([
        {
          $match: filter,
        },

        // Si estamos filtrando gays, cada guest debe ser un resultado independiente.
        // En cualquier otro caso:
        // - Solo = guestId
        // - Grupo = groupId
        {
          $set: {
            aggregationKey: query.gay === 'true' ? '$guestId' : { $ifNull: ['$groupId', '$guestId'] },
          },
        },

        // Agrupar según aggregationKey
        {
          $group: {
            _id: '$aggregationKey',
            groupId: { $first: '$groupId' },
            groupType: { $first: '$groupType' },
            nights: { $first: '$nights' },
            stayed: { $first: '$stayed' },
            visitedDate: { $first: '$visitedDate' },
            createdAt: { $first: '$createdAt' },
            updatedAt: { $first: '$updatedAt' },

            members: {
              $push: '$$ROOT',
            },
          },
        },

        // Más recientes primero
        {
          $sort: {
            visitedDate: -1,
            _id: 1,
          },
        },

        // Paginar y contar directamente en MongoDB
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            metadata: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    const data: GuestListItem[] = [];

    for (const item of result?.data ?? []) {
      // Si estamos filtrando gays:
      // cada persona cuenta como un resultado individual,
      // aunque pertenezca al mismo grupo.
      if (query.gay === 'true') {
        const member = await this.addSignedUrls(item.members[0]);
        data.push(toSolo(member));
        continue;
      }

      // Solo
      if (!item.groupId) {
        const member = await this.addSignedUrls(item.members[0]);
        data.push(toSolo(member));
        continue;
      }

      const membersWithSignedUrls = await Promise.all(item.members.map((member: GuestLean) => this.addSignedUrls(member)));

      const group: GroupListItem = {
        groupId: item.groupId,
        groupType: item.groupType,
        nights: item.nights,
        stayed: item.stayed,
        visitedDate: item.visitedDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        members: membersWithSignedUrls.map(toMember),
      };

      data.push(group);
    }

    const total = result?.metadata?.[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findById(guestId: string): Promise<GuestLean | null> {
    const guest = await this.model.findOne({ guestId }).lean<GuestLean>().exec();
    if (!guest) return null;

    return this.addPhotoUrls(guest);
  }

  async createSolo(input: Record<string, unknown>, files: Express.Multer.File[] = []): Promise<Omit<GuestLean, 'groupId'>> {
    const guestId = generateGuestId();

    console.log('[GuestService] 1. Creating Mongo document');

    const doc = await this.model.create({
      guestId,
      groupId: null,
      groupType: 'solo',
      ...input,
      photos: [],
    });

    console.log('[GuestService] 2. Mongo document created');

    let uploadedPhotos: UploadedPhoto[] = [];

    try {
      if (files.length > 0) {
        console.log('[GuestService] 3. Uploading photos:', files.length);

        uploadedPhotos = await storageService.uploadGuestPhotos(guestId, files);

        console.log('[GuestService] 4. Photos uploaded');

        doc.photos = uploadedPhotos.map((photo) => ({
          path: photo.path,
          thumbnailPath: photo.thumbnailPath,
        }));

        console.log('[GuestService] 5. Saving photo references');

        await doc.save();

        console.log('[GuestService] 6. Photo references saved');
      }
    } catch (error) {
      console.error('[GuestService] Error after photo upload. Cleaning up GCS files...', error);

      if (uploadedPhotos.length > 0) {
        await storageService.deleteGuestPhotos(uploadedPhotos);
      }

      throw error;
    }

    const { groupId: _groupId, ...guest } = doc.toJSON() as GuestLean;

    console.log('[GuestService] 7. Document converted to JSON');

    if (guest.photos?.length) {
      console.log('[GuestService] 8. Generating signed URLs');

      guest.photos = await Promise.all(
        guest.photos.map(async (photo) => {
          console.log('[GuestService] Signing:', photo.path);

          const [url, thumbnailUrl] = await Promise.all([
            storageService.getSignedUrl(photo.path),
            photo.thumbnailPath ? storageService.getSignedUrl(photo.thumbnailPath) : Promise.resolve(undefined),
          ]);

          return {
            ...photo,
            url,
            thumbnailUrl: thumbnailUrl ?? url,
          };
        })
      );

      console.log('[GuestService] 9. Signed URLs generated');
    }

    console.log('[GuestService] 10. Returning guest');

    return guest;
  }

  async update(
    guestId: string,
    input: UpdateGuestInput,
    files: Express.Multer.File[] = [],
    photoIds?: string[]
  ): Promise<GuestLean | null> {
    const guest = await this.model.findOne({ guestId }).exec();

    if (!guest) {
      return null;
    }

    const existingPhotos = guest.photos ?? [];

    // ---------------------------------------------------------
    // 1. Determinar qué fotos conservar y cuáles eliminar
    // ---------------------------------------------------------

    let photosToKeep = existingPhotos;
    let photosToDelete: typeof existingPhotos = [];

    if (photoIds !== undefined) {
      const existingPhotoIds = new Set(
        existingPhotos.map((photo) => photo._id?.toString()).filter((id): id is string => Boolean(id))
      );

      // Validar que TODOS los IDs recibidos existen.
      // Si alguno no existe, abortamos el update completo.
      const invalidPhotoIds = photoIds.filter((photoId) => !existingPhotoIds.has(photoId));

      if (invalidPhotoIds.length > 0) {
        throw new AppError(`The following photo IDs do not exist: ${invalidPhotoIds.join(', ')}`, 400);
      }

      const requestedPhotoIds = new Set(photoIds);

      // Fotos que el usuario quiere conservar
      photosToKeep = existingPhotos.filter((photo) => {
        const photoId = photo._id?.toString();

        return photoId ? requestedPhotoIds.has(photoId) : false;
      });

      // Fotos existentes que el usuario ya no quiere
      photosToDelete = existingPhotos.filter((photo) => {
        const photoId = photo._id?.toString();

        return photoId ? !requestedPhotoIds.has(photoId) : true;
      });
    }

    // ---------------------------------------------------------
    // 2. Validar máximo de 5 fotos
    // ---------------------------------------------------------

    const finalPhotoCount = photosToKeep.length + files.length;

    if (finalPhotoCount > 5) {
      throw new AppError('A guest can have a maximum of 5 photos', 400);
    }

    let uploadedPhotos: UploadedPhoto[] = [];

    try {
      // -------------------------------------------------------
      // 3. Subir fotos nuevas
      // -------------------------------------------------------

      if (files.length > 0) {
        uploadedPhotos = await storageService.uploadGuestPhotos(guestId, files);
      }

      // -------------------------------------------------------
      // 4. Crear referencias de las fotos nuevas
      // -------------------------------------------------------

      const newPhotos = uploadedPhotos.map((photo) => ({
        path: photo.path,
        thumbnailPath: photo.thumbnailPath,
      }));

      // -------------------------------------------------------
      // 5. Actualizar los campos del guest
      // -------------------------------------------------------

      Object.assign(guest, input);

      // Las fotos se controlan exclusivamente aquí.
      // Nunca usamos input.photos.
      guest.photos = [...photosToKeep, ...newPhotos] as typeof guest.photos;

      // -------------------------------------------------------
      // 6. Guardar MongoDB
      // -------------------------------------------------------

      await guest.save();

      // -------------------------------------------------------
      // 7. Eliminar de GCS las fotos que ya no están en MongoDB
      // -------------------------------------------------------

      if (photosToDelete.length > 0) {
        await storageService.deleteGuestPhotos(
          photosToDelete.map((photo) => ({
            path: photo.path,
            thumbnailPath: photo.thumbnailPath,
          }))
        );
      }

      // -------------------------------------------------------
      // 8. Generar signed URLs
      // -------------------------------------------------------

      const result = guest.toJSON() as GuestLean;

      if (result.photos?.length) {
        result.photos = await Promise.all(
          result.photos.map(async (photo) => {
            const [url, thumbnailUrl] = await Promise.all([
              storageService.getSignedUrl(photo.path),
              photo.thumbnailPath ? storageService.getSignedUrl(photo.thumbnailPath) : Promise.resolve(undefined),
            ]);

            return {
              ...photo,
              url,
              thumbnailUrl: thumbnailUrl ?? url,
            };
          })
        );
      }

      return result;
    } catch (error) {
      // -------------------------------------------------------
      // 9. Si algo falla después de subir fotos nuevas,
      // eliminar únicamente las fotos nuevas.
      //
      // Las fotos antiguas no se tocan.
      // -------------------------------------------------------

      if (uploadedPhotos.length > 0) {
        await storageService.deleteGuestPhotos(uploadedPhotos);
      }

      throw error;
    }
  }

  async deletePhoto(photo: { path: string; thumbnailPath?: string }): Promise<void> {
    await storageService.deletePhoto({
      path: photo.path,
      thumbnailPath: photo.thumbnailPath,
    });
  }

  async delete(guestId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ guestId });

    return result.deletedCount === 1;
  }
}

export const guestService = new GuestService(GuestModel);
