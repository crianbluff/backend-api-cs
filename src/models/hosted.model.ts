import mongoose, { Document, Model, Schema } from 'mongoose';
import { CONTINENTS, GENDERS, GROUP_TYPES, REGIONS } from '../types/global.types';
import { GuestIndividual, VisitFields } from '../types/guest.types';
import { CompanionshipMember } from '../types/hosted.types';
import { countryCode, nullableString, nullableTrimmedString } from './schemas/common.schema';

// Document
export interface IHostedDocument extends Document, GuestIndividual, VisitFields {
  groupTypeCompanionship: CompanionshipMember;
  companionshipMembers: CompanionshipMember[];

  createdAt: Date;
  updatedAt: Date;
}

// Companionship member schema
const companionshipMemberSchema = new Schema<CompanionshipMember>(
  {
    hometownCode: { ...countryCode, required: true },
    prefixCode: { type: String, required: true, trim: true },
    continent: { type: String, required: true, enum: CONTINENTS },
    region: { type: String, required: true, enum: REGIONS },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: GENDERS },
    whatsapp: { type: String, required: true, trim: true },
    ambassador: { type: Boolean, required: true },
    isFirstTime: { type: Boolean, required: true },
    livingInCode: { ...countryCode, default: null },
    hometown: nullableString,
    livingIn: nullableString,
    urlProfileCs: nullableString,
    instagram: nullableString,
    birthDate: nullableString,
  },
  { _id: false, versionKey: false }
);

// Schema
export const hostedSchema = new Schema<IHostedDocument>(
  {
    // Identity
    guestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // Visit
    nights: { type: Number, required: false, default: 0 },
    hangOut: { type: Boolean, required: true },
    visitedDate: { type: String, required: true, trim: true },
    isFirstTime: { type: Boolean, default: false },
    ambassador: { type: Boolean, default: false },
    didTheyReq: { type: Boolean, default: false },
    gift: { type: [String], default: null },
    comments: { ...nullableTrimmedString, maxlength: [2000, 'comments cannot exceed 2000 characters'] },

    // References
    theirReference: { ...nullableTrimmedString, maxlength: [500, 'theirReference cannot exceed 500 characters'] },
    myReference: { ...nullableTrimmedString, maxlength: [500, 'myReference cannot exceed 500 characters'] },

    // Individual
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
    // Companionship
    groupTypeCompanionship: { type: String, required: true, enum: GROUP_TYPES },
    companionshipMembers: {
      type: [companionshipMemberSchema],
      default: [],
      validate: {
        validator: (members: CompanionshipMember[]) => members.length <= 4,
        message: 'companionshipMembers cannot have more than 4 members',
      },
    },
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
hostedSchema.index({ visitedDate: 1 });
hostedSchema.index({ continent: 1 });
hostedSchema.index({ region: 1 });
hostedSchema.index({ isFirstTime: 1 });
hostedSchema.index({ ambassador: 1 });
hostedSchema.index({ didTheyReq: 1 });
hostedSchema.index({ groupTypeCompanionship: 1 });

// Model
export const HostedModel: Model<IHostedDocument> = mongoose.model<IHostedDocument>('Hosted', hostedSchema, 'hosted');
