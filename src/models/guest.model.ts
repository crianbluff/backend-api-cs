import mongoose, { Document, Schema, Model } from 'mongoose';
import { Continent, Gender, VisitedMonth } from '../types/guest.types';

const CONTINENTS: Continent[] = ['Africa', 'South America', 'North America', 'Central America', 'Europe', 'Asia', 'Oceania'];
const GENDERS: Gender[] = ['male', 'female', 'trans'];
const MONTHS: VisitedMonth[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// ─── Sub-document for individual person info ──────────────────────────────────

const individualInfoSchema = new Schema(
  {
    rating: { type: Number, min: 1, max: 5, default: null },
    countryCode: { type: String, required: true, lowercase: true, trim: true },
    prefixCode: { type: String, default: null },
    country: { type: String, required: true, trim: true },
    flag: { type: String, required: true },
    continent: { type: String, required: true, enum: CONTINENTS },
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

// ─── Document interface ───────────────────────────────────────────────────────

export interface IGuestDocument extends Document {
  guestId: string;
  nights: number;
  stayed: boolean;
  didWeHangOut: boolean;
  visitedMonth: VisitedMonth;
  visitedYear: number;
  gift: string[] | null;
  comments: string | null;
  wasACouple: boolean;
  coupleId: string | null;
  // Solo fields
  rating?: number | null;
  countryCode?: string;
  prefixCode?: string | null;
  country?: string;
  flag?: string;
  continent?: Continent;
  fullName?: string;
  birthplace?: string | null;
  livingIn?: string | null;
  birthyear?: number | null;
  occupation?: string[];
  urlProfileCs?: string | number | null;
  gender?: Gender;
  whatsapp?: string | null;
  instagram?: string | null;
  // Couple field
  coupleInfo?: Array<{
    rating: number | null;
    countryCode: string;
    prefixCode: string | null;
    country: string;
    flag: string;
    continent: Continent;
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

// ─── Schema ───────────────────────────────────────────────────────────────────

const guestSchema = new Schema<IGuestDocument>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    nights: { type: Number, required: true, min: [1, 'nights must be at least 1'] },
    stayed: { type: Boolean, required: true },
    didWeHangOut: { type: Boolean, required: true },
    visitedMonth: { type: String, required: true, enum: MONTHS },
    visitedYear: { type: Number, required: true, min: [2007, 'visitedYear cannot be before 2007'] },
    gift: { type: [String], default: null },
    comments: { type: String, default: null, trim: true },
    wasACouple: { type: Boolean, required: true },
    coupleId: { type: String, default: null },

    // Solo guest flat fields (undefined when wasACouple=true)
    rating: { type: Number, min: 1, max: 5, default: null },
    countryCode: { type: String, lowercase: true, trim: true },
    prefixCode: { type: String, default: null },
    country: { type: String, trim: true },
    flag: { type: String },
    continent: { type: String, enum: CONTINENTS },
    fullName: { type: String, trim: true },
    birthplace: { type: String, default: null },
    livingIn: { type: String, default: null },
    birthyear: { type: Number, default: null },
    occupation: { type: [String], default: [] },
    urlProfileCs: { type: Schema.Types.Mixed, default: null },
    gender: { type: String, enum: GENDERS },
    whatsapp: { type: String, default: null },
    instagram: { type: String, default: null },

    // Couple nested array
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

// ─── Indexes ──────────────────────────────────────────────────────────────────

guestSchema.index({ visitedYear: 1, visitedMonth: 1 });
guestSchema.index({ country: 1 });
guestSchema.index({ continent: 1 });
guestSchema.index({ wasACouple: 1 });
guestSchema.index({ coupleId: 1 }, { sparse: true });

// ─── Model ────────────────────────────────────────────────────────────────────

export const GuestModel: Model<IGuestDocument> = mongoose.model<IGuestDocument>('Guest', guestSchema, 'guests');
