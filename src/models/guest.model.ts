import mongoose, { Document, Schema, Model } from 'mongoose';
import { Continent, Region, Gender } from '../types/guest.types';

const CONTINENTS: Continent[] = ['Africa', 'America', 'Europe', 'Asia', 'Oceania'];
const REGIONS: Region[] = [
  'North America',
  'Central America',
  'South America',
  'Caribe',
  'Middle East Asia',
  'Southeast Asia',
  'Eastern Asia',
  'South Asia',
  'Central Asia',
  'West Europe',
  'Scandinavia',
  'Southern Europe',
  'Northern Europe',
  'Eastern Europe',
  'Oceania',
  'Africa',
];
const GENDERS: Gender[] = ['male', 'female', 'trans'];

const individualInfoSchema = new Schema(
  {
    rating: { type: Number, min: 1, max: 5, default: null },
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    prefixCode: { type: String, default: null },
    continent: { type: String, required: true, enum: CONTINENTS },
    region: { type: String, required: true, enum: REGIONS },
    fullName: { type: String, required: true, trim: true },
    birthplace: { type: String, default: null },
    livingIn: { type: String, default: null },
    birthyear: { type: Number, default: null },
    occupation: { type: [String], default: [] },
    urlProfileCs: { type: Schema.Types.Mixed, default: null },
    gender: { type: String, required: true, enum: GENDERS },
    whatsapp: { type: String, default: null },
    instagram: { type: String, default: null },
  },
  { _id: false }
);

export interface IGuestDocument extends Document {
  guestId: string;
  nights: number;
  stayed: boolean;
  didWeHangOut: boolean;
  visitedDate: string;
  visitedAt: Date;
  isFirstTime: boolean;
  gift: string[] | null;
  comments: string | null;
  wasACouple: boolean;
  coupleId: string | null;
  // Solo flat fields
  rating?: number | null;
  countryCode?: string;
  prefixCode?: string | null;
  continent?: Continent;
  region?: Region;
  fullName?: string;
  birthplace?: string | null;
  livingIn?: string | null;
  birthyear?: number | null;
  occupation?: string[];
  urlProfileCs?: string | number | null;
  gender?: Gender;
  whatsapp?: string | null;
  instagram?: string | null;
  coupleInfo?: Array<{
    rating: number | null;
    countryCode: string;
    prefixCode: string | null;
    continent: Continent;
    region: Region;
    fullName: string;
    birthplace: string | null;
    livingIn: string | null;
    birthyear: number | null;
    occupation: string[];
    urlProfileCs: string | number | null;
    gender: Gender;
    whatsapp: string | null;
    instagram: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuestDocument>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    nights: { type: Number, required: true, min: [1, 'nights must be at least 1'] },
    stayed: { type: Boolean, required: true },
    didWeHangOut: { type: Boolean, required: true },
    visitedDate: { type: String, required: true, trim: true },
    visitedAt: { type: Date, required: true, index: true },
    isFirstTime: { type: Boolean, default: false },
    gift: { type: [String], default: null },
    comments: { type: String, default: null, trim: true },
    wasACouple: { type: Boolean, required: true },
    coupleId: { type: String, default: null },
    // Solo flat fields
    rating: { type: Number, min: 1, max: 5, default: null },
    countryCode: { type: String, uppercase: true, trim: true },
    prefixCode: { type: String, default: null },
    continent: { type: String, enum: CONTINENTS },
    region: { type: String, enum: REGIONS },
    fullName: { type: String, trim: true },
    birthplace: { type: String, default: null },
    livingIn: { type: String, default: null },
    birthyear: { type: Number, default: null },
    occupation: { type: [String], default: [] },
    urlProfileCs: { type: Schema.Types.Mixed, default: null },
    gender: { type: String, enum: GENDERS },
    whatsapp: { type: String, default: null },
    instagram: { type: String, default: null },
    coupleInfo: { type: [individualInfoSchema], default: undefined },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['_id'];
        return ret;
      },
    },
  }
);

// Indexes
guestSchema.index({ visitedAt: -1 });
guestSchema.index({ continent: 1 });
guestSchema.index({ region: 1 });
guestSchema.index({ isFirstTime: 1 });
guestSchema.index({ wasACouple: 1 });
guestSchema.index({ coupleId: 1 }, { sparse: true });

export const GuestModel: Model<IGuestDocument> = mongoose.model<IGuestDocument>('Guest', guestSchema, 'guests');
