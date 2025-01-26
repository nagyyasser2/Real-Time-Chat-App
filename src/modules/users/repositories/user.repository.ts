import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { BaseRepository } from 'src/shared/utils/repositories/base.repository';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
        super(userModel);
    }

    // Add custom methods specific to the User entity
    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }
}