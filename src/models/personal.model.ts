import mongoose, { Model } from 'mongoose';
import { guestSchema, IGuestDocument } from './guest.model';

export const PersonalModel: Model<IGuestDocument> = mongoose.model<IGuestDocument>('Personal', guestSchema, 'personal');
