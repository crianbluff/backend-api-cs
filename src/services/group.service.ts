import { Model } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { generateCoupleId, generateGuestId } from '../utils/nanoid';
import { CreateGroupGuestInput } from '../utils/validation';
import { GuestLean } from './guest.service';

function toGroupResponse(doc: GuestLean): Omit<GuestLean, 'groupId'> {
  const { groupId, ...guest } = doc;

  return guest;
}

export class GroupService {
  constructor(protected readonly model: Model<IGuestDocument>) {}

  async findByGroupId(groupId: string): Promise<Omit<GuestLean, 'groupId'>[]> {
    const guests = await this.model.find({ groupId }).lean<GuestLean[]>().exec();
    return guests.map(toGroupResponse);
  }

  async createGroup(input: CreateGroupGuestInput): Promise<Omit<GuestLean, 'groupId'>[]> {
    const groupId = generateCoupleId();
    const { members, groupType, nights, stayed, visitedDate } = input;

    const docs = await GuestModel.insertMany(
      members.map((m) => ({
        ...m,
        guestId: generateGuestId(),
        groupId,
        groupType,
        nights,
        stayed,
        visitedDate,
      }))
    );

    return docs.map((d) => toGroupResponse(d.toObject() as GuestLean));
  }

  async updateGroup(groupId: string, input: Partial<CreateGroupGuestInput>): Promise<Omit<GuestLean, 'groupId'>[]> {
    const existing = await this.model.find({ groupId });

    if (!existing.length) {
      return [];
    }

    const { members, groupType, nights, stayed, visitedDate } = input;

    const sharedUpdates = {
      ...(groupType !== undefined && { groupType }),
      ...(nights !== undefined && { nights }),
      ...(stayed !== undefined && { stayed }),
      ...(visitedDate !== undefined && { visitedDate }),
    };

    if (members) {
      await this.model.deleteMany({ groupId });

      await this.model.insertMany(
        members.map((member) => ({
          ...member,
          guestId: generateGuestId(),
          groupId,
          ...sharedUpdates,
        }))
      );
    } else {
      await this.model.updateMany(
        { groupId },
        {
          $set: sharedUpdates,
        }
      );
    }

    const updated = await this.model.find({ groupId }).lean<GuestLean[]>().exec();

    return updated.map(toGroupResponse);
  }

  async deleteGroup(groupId: string): Promise<number> {
    const res = await this.model.deleteMany({ groupId });
    return res.deletedCount ?? 0;
  }
}

export const groupService = new GroupService(GuestModel);
