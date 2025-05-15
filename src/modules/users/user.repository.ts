import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { LastSeenVisibility } from './enums/lastSeenVisibility.enum';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(user: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(user);
  }

  async findUserById(
    userId: any,
    projection?: any,
  ): Promise<UserDocument | null> {
    return this.userModel.findById(userId).select(projection).exec();
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ phoneNumber }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ username }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return await this.userModel.find().exec();
  }

  async updateUser(userId: any, updateData: any): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }

  async updateProfilePic(
    userId: any,
    profilePicUrl: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { profilePic: profilePicUrl }, { new: true })
      .exec();
  }

  async updateStatus(
    userId: string,
    status: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { status }, { new: true })
      .exec();
  }

  async updateLastSeen(userId: string): Promise<UserDocument | null> {
    // Ensure userId is a valid ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    return await this.userModel
      .findByIdAndUpdate(userId, { lastSeen: new Date() }, { new: true })
      .exec();
  }

  async checkLastSeenAccess(requestingUserId: string, userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    if (
      user.privacySettings?.lastSeenVisibility === LastSeenVisibility.Nobody
    ) {
      return null;
    }

    if (
      user.privacySettings?.lastSeenVisibility === LastSeenVisibility.Contacts
    ) {
      // Check if requestingUser is in contacts and not blocked
      const isContact = user.contacts.some(
        (contact) =>
          contact.user.toString() === requestingUserId && !contact.blocked,
      );

      return isContact ? user.lastSeen : null;
    }

    return user.lastSeen; // If visibility is Everyone
  }

  async updatePrivacySettings(
    userId: any,
    privacySettings: Partial<User['privacySettings']>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { $set: { privacySettings } }, { new: true })
      .exec();
  }

  async deleteUser(userId: any): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(userId).exec();
  }

  async existsByPhoneNumber(phoneNumber: any): Promise<boolean> {
    const exists = await this.userModel.exists({ phoneNumber });
    return !!exists;
  }

  async existsByUsername(username: any): Promise<boolean> {
    const exists = await this.userModel.exists({ username });
    return !!exists;
  }

  async searchUsers(
    query: string,
    field: 'username' | 'phoneNumber' | 'country',
    projection?: Record<string, 1>,
    page = 1,
    limit = 10,
  ): Promise<{ data: UserDocument[]; total: number }> {
    const regex = new RegExp(query, 'i');
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find({
          [field]: { $regex: regex },
        })
        .select(projection || {})
        .skip(skip)
        .limit(limit)
        .exec(),

      this.userModel.countDocuments({
        [field]: { $regex: regex },
      }),
    ]);

    return { data, total };
  }
}
