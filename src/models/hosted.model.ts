import mongoose, { Model } from 'mongoose';
import { guestSchema, IGuestDocument } from './guest.model';

export const HostedModel: Model<IGuestDocument> = mongoose.model<IGuestDocument>('Hosted', guestSchema, 'hosted');
