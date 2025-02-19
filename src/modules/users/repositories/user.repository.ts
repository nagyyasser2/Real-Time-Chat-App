import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
 
@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) { }

  async createUser(user: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(user);
  }

  async findUserById(userId: any): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
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

  async updateUser(
    userId: any,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
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

  async updateLastSeen(userId: any): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { lastSeen: new Date() }, { new: true })
      .exec();
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
}
