import mongoose, { Document, Schema, Model } from 'mongoose';
import { Continent, Region, Gender, GroupType } from '../types/guest.types';

const CONTINENTS: Continent[] = ['africa', 'america', 'europe', 'asia', 'oceania'];
const REGIONS: Region[] = [
  'north_america',
  'central_america',
  'south_america',
  'caribbean',
  'middle_east_asia',
  'southeast_asia',
  'eastern_asia',
  'south_asia',
  'central_asia',
  'west_europe',
  'scandinavia',
  'southern_europe',
  'northern_europe',
  'eastern_europe',
  'oceania',
  'africa',
];
const GENDERS: Gender[] = ['male', 'female', 'trans'];
const GROUP_TYPES: GroupType[] = ['solo', 'couple', 'friends', 'family'];

export interface IGuestDocument extends Document {
  guestId: string;
  groupId: string | null;
  groupType: GroupType | null;
  // Shared visit fields
  nights: number;
  stayed: boolean;
  hangOut: boolean;
  visitedDate: string;
  isFirstTime: boolean;
  gift: string[] | null;
  comments: string | null;
  // Individual fields
  rating: number | null;
  hometownCode: string;
  livingInCode: string | null;
  prefixCode: string | null;
  continent: Continent;
  region: Region;
  fullName: string;
  hometown: string | null;
  livingIn: string | null;
  birthDate: string | null;
  occupation: string[];
  urlProfileCs: string | null;
  gender: Gender;
  whatsapp: string | null;
  instagram: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuestDocument>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    groupId: { type: String, default: null },
    groupType: { type: String, required: true, enum: GROUP_TYPES },
    // Shared visit fields
    nights: { type: Number, required: true, min: [1, 'nights must be at least 1'] },
    stayed: { type: Boolean, required: true },
    hangOut: { type: Boolean, required: true },
    visitedDate: { type: String, required: true, trim: true },
    isFirstTime: { type: Boolean, default: false },
    gift: { type: [String], default: null },
    comments: { type: String, default: null, trim: true },
    // Individual fields
    rating: { type: Number, min: 1, max: 5, default: null },
    hometownCode: { type: String, required: true, uppercase: true, trim: true },
    livingInCode: { type: String, uppercase: true, trim: true, default: null },
    prefixCode: { type: String, default: null },
    continent: { type: String, required: true, enum: CONTINENTS },
    region: { type: String, required: true, enum: REGIONS },
    fullName: { type: String, required: true, trim: true },
    hometown: { type: String, default: null },
    livingIn: { type: String, default: null },
    birthDate: { type: String, default: null },
    occupation: { type: [String], default: [] },
    urlProfileCs: { type: Schema.Types.Mixed, default: null },
    gender: { type: String, required: true, enum: GENDERS },
    whatsapp: { type: String, default: null },
    instagram: { type: String, default: null },
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

guestSchema.index({ groupId: 1 }, { sparse: true });
guestSchema.index({ visitedDate: 1 });
guestSchema.index({ continent: 1 });
guestSchema.index({ region: 1 });
guestSchema.index({ isFirstTime: 1 });

export const GuestModel: Model<IGuestDocument> = mongoose.model<IGuestDocument>('Guest', guestSchema, 'guests');
