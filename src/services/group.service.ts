import { GuestModel } from '../models/guest.model';
import { generateCoupleId, generateGuestId } from '../utils/nanoid';
import { CreateGroupGuestInput } from '../utils/validation';
import { GuestLean } from './guest.service';

export class GroupService {
  async findByGroupId(groupId: string): Promise<GuestLean[]> {
    return GuestModel.find({ groupId }).lean<GuestLean[]>().exec();
  }

  async createGroup(input: CreateGroupGuestInput): Promise<GuestLean[]> {
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

    return docs.map((d) => d.toObject() as GuestLean);
  }

  async updateGroup(groupId: string, input: Partial<CreateGroupGuestInput>): Promise<GuestLean[]> {
    const existing = await GuestModel.find({ groupId });

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
      await GuestModel.deleteMany({ groupId });

      await GuestModel.insertMany(
        members.map((member) => ({
          ...member,
          guestId: generateGuestId(),
          groupId,
          ...sharedUpdates,
        }))
      );
    } else {
      await GuestModel.updateMany(
        { groupId },
        {
          $set: sharedUpdates,
        }
      );
    }

    return GuestModel.find({ groupId }).lean<GuestLean[]>().exec();
  }

  async deleteGroup(groupId: string): Promise<number> {
    const res = await GuestModel.deleteMany({ groupId });
    return res.deletedCount ?? 0;
  }
}

export const groupService = new GroupService();
