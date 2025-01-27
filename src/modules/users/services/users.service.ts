import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../schemas/user.schema';
import { Types } from 'mongoose';
import { LastSeenVisibility } from '../enums/lastSeenVisibility.enum';
import { PhotoVisibility } from '../enums/profile-photo.enum';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) { }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { phoneNumber, username, privacySettings } = createUserDto;

    if (await this.userRepository.existsByPhoneNumber(phoneNumber)) {
      throw new BadRequestException('Phone number is already in use');
    }

    if (username && (await this.userRepository.existsByUsername(username))) {
      throw new BadRequestException('Username is already in use');
    }

    const transformedPrivacySettings = privacySettings || {
      lastSeenVisibility: LastSeenVisibility.Contacts,
      profilePhotoVisibility: PhotoVisibility.Contacts,
    };

    const user = await this.userRepository.createUser({
      ...createUserDto,
      privacySettings: transformedPrivacySettings,
    });

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const existingUser = await this.userRepository.findUserById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (
      updateUserDto.phoneNumber &&
      updateUserDto.phoneNumber !== existingUser.phoneNumber
    ) {
      const phoneExists = await this.userRepository.existsByPhoneNumber(
        updateUserDto.phoneNumber,
      );
      if (phoneExists) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    if (
      updateUserDto.username &&
      updateUserDto.username !== existingUser.username
    ) {
      const usernameExists = await this.userRepository.existsByUsername(
        updateUserDto.username,
      );
      if (usernameExists) {
        throw new BadRequestException('Username already taken');
      }
    }
    const updateData: Partial<User> = {
      ...updateUserDto,
      privacySettings: updateUserDto.privacySettings
        ? {
          lastSeenVisibility:
            updateUserDto.privacySettings.lastSeenVisibility,
          profilePhotoVisibility:
            updateUserDto.privacySettings.profilePhotoVisibility,
        }
        : undefined,
    };

    const updatedUser = await this.userRepository.updateUser(id, updateData);
    if (!updatedUser) {
      throw new NotFoundException('User not found during update');
    }
    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const deletedUser = await this.userRepository.deleteUser(id);
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return deletedUser;
  }

  async updateProfilePic(userId: string, profilePicUrl: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.updateProfilePic(
      userId,
      profilePicUrl,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateStatus(userId: string, status: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.updateStatus(userId, status);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateLastSeen(userId: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.updateLastSeen(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updatePrivacySettings(
    userId: string,
    privacySettings: Partial<User['privacySettings']>,
  ): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.updatePrivacySettings(
      userId,
      privacySettings,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.findByPhoneNumber(phoneNumber);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findByUsername(username);
  }
}
