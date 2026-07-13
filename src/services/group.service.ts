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

  async deleteGroup(groupId: string): Promise<number> {
    const res = await GuestModel.deleteMany({ groupId });
    return res.deletedCount ?? 0;
  }
}

export const groupService = new GroupService();
