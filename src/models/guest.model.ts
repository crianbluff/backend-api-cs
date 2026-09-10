import mongoose, { Document, Model, Schema } from 'mongoose';
import { CONTINENTS, GENDERS, GROUP_TYPES, REGIONS } from '../types/global.types';
import { GuestDocument } from '../types/guest.types';
import { countryCode, nullableString, nullableTrimmedString } from './schemas/common.schema';

// Mongoose document
export interface IGuestDocument extends Document, GuestDocument {}

// Schema
export const guestSchema = new Schema<IGuestDocument>(
  {
    // -------------------------------------------------------------------------// Identity// -------------------------------------------------------------------------
    guestId: { type: String, required: true, unique: true, index: true, trim: true },
    groupId: { type: String, default: null, trim: true },
    groupType: { type: String, required: true, enum: GROUP_TYPES },
    // -------------------------------------------------------------------------// Visit// -------------------------------------------------------------------------
    nights: { type: Number, default: 0 },
    stayed: { type: Boolean, required: true },
    hangOut: { type: Boolean, required: true },
    visitedDate: { type: String, required: true, trim: true },
    isFirstTime: { type: Boolean, default: false },
    ambassador: { type: Boolean, default: false },
    didTheyReq: { type: Boolean, default: false },
    gift: { type: [String], default: null },
    comments: { ...nullableTrimmedString, maxlength: [2000, 'comments cannot exceed 2000 characters'] },
    // -------------------------------------------------------------------------// References// -------------------------------------------------------------------------
    theirReference: { ...nullableTrimmedString, maxlength: [500, 'theirReference cannot exceed 500 characters'] },
    myReference: { ...nullableTrimmedString, maxlength: [500, 'myReference cannot exceed 500 characters'] },
    // -------------------------------------------------------------------------// Individual// -------------------------------------------------------------------------
    rating: { type: Number, min: 1, max: 5, default: null },
    hometownCode: { ...countryCode, required: true },
    countryCodeWeMet: { ...countryCode, required: true },
    livingInCode: { ...countryCode, default: null },
    prefixCode: nullableString,
    continent: { type: String, required: true, enum: CONTINENTS },
    region: { type: String, required: true, enum: REGIONS },
    fullName: { type: String, required: true, trim: true },
    hometown: nullableString,
    livingIn: nullableString,
    cityWeMet: nullableString,
    locationWeMet: nullableString,
    birthDate: nullableString,
    occupation: { type: [String], default: [] },
    urlProfileCs: { type: Schema.Types.Mixed, default: null },
    gender: { type: String, required: true, enum: GENDERS },
    isGay: { type: Boolean, default: false },
    whatsapp: nullableString,
    instagram: nullableString,
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
guestSchema.index({ groupId: 1 }, { sparse: true });
guestSchema.index({ visitedDate: 1 });
guestSchema.index({ continent: 1 });
guestSchema.index({ region: 1 });
guestSchema.index({ isFirstTime: 1 });
guestSchema.index({ ambassador: 1 });
guestSchema.index({ didTheyReq: 1 });

// Model
export const GuestModel: Model<IGuestDocument> = mongoose.model<IGuestDocument>('Guest', guestSchema, 'guests');
