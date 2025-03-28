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

  async addContact(currentUserId: string, contactUserId: string): Promise<User> {
    if (!Types.ObjectId.isValid(currentUserId)) {
      throw new BadRequestException('Invalid current user ID');
    }
    if (!Types.ObjectId.isValid(contactUserId)) {
      throw new BadRequestException('Invalid contact user ID');
    }
  
    const currentUser = await this.userRepository.findUserById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }
  
    const contactUser = await this.userRepository.findUserById(contactUserId);
    if (!contactUser) {
      throw new NotFoundException('Contact user not found');
    }
  
    if (currentUserId === contactUserId) {
      throw new BadRequestException('Cannot add yourself as a contact');
    }
  
    const alreadyAddedToCurrent = currentUser.contacts.some(
      (contact) => contact.user?.toString() === contactUserId
    );
    if (alreadyAddedToCurrent) {
      throw new BadRequestException('Contact already added to current user');
    }
  
    const alreadyAddedToContact = contactUser.contacts.some(
      (contact) => contact.user?.toString() === currentUserId
    );
    if (alreadyAddedToContact) {
      throw new BadRequestException('You are already added to the contact user');
    }
  
    // Use the original string IDs directly
    const newContactForCurrent = { user: contactUserId, blocked: false };
    const newContactForContact = { user: currentUserId, blocked: false };
  
    // Update currentUser's contacts
    const newContactsForCurrent = [...currentUser.contacts, newContactForCurrent];
    const updateDataForCurrent = { contacts: newContactsForCurrent };
  
    const updatedCurrentUser = await this.userRepository.updateUser(currentUserId, updateDataForCurrent);
    if (!updatedCurrentUser) {
      throw new NotFoundException('Current user not found during update');
    }
  
    // Update contactUser's contacts
    const newContactsForContact = [...contactUser.contacts, newContactForContact];
    const updateDataForContact = { contacts: newContactsForContact };
  
    const updatedContactUser = await this.userRepository.updateUser(contactUserId, updateDataForContact);
    if (!updatedContactUser) {
      throw new NotFoundException('Contact user not found during update');
    }
  
    return updatedCurrentUser;
  }

  async removeContact(currentUserId: string, contactUserId: string): Promise<User> {
    if (!Types.ObjectId.isValid(currentUserId)) {
      throw new BadRequestException('Invalid current user ID');
    }
    if (!Types.ObjectId.isValid(contactUserId)) {
      throw new BadRequestException('Invalid contact user ID');
    }
  
    const currentUser = await this.userRepository.findUserById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }
  
    const contactUser = await this.userRepository.findUserById(contactUserId);
    if (!contactUser) {
      throw new NotFoundException('Contact user not found');
    }
  
    if (currentUserId === contactUserId) {
      throw new BadRequestException('Cannot remove yourself as a contact');
    }
  
    // Check if the contact exists in current user's contact list
    const contactIndexInCurrent = currentUser.contacts.findIndex(
      (contact) => contact.user?.toString() === contactUserId
    );
    if (contactIndexInCurrent === -1) {
      throw new BadRequestException('Contact not found in your contact list');
    }
  
    // Check if the current user exists in contact's contact list
    const contactIndexInContact = contactUser.contacts.findIndex(
      (contact) => contact.user?.toString() === currentUserId
    );
    if (contactIndexInContact === -1) {
      throw new BadRequestException('You are not in the contact\'s contact list');
    }
  
    // Remove contact from current user's list
    const updatedContactsForCurrent = [...currentUser.contacts];
    updatedContactsForCurrent.splice(contactIndexInCurrent, 1);
    const updateDataForCurrent = { contacts: updatedContactsForCurrent };
  
    // Remove current user from contact's list
    const updatedContactsForContact = [...contactUser.contacts];
    updatedContactsForContact.splice(contactIndexInContact, 1);
    const updateDataForContact = { contacts: updatedContactsForContact };
  
    // Update both users
    const updatedCurrentUser = await this.userRepository.updateUser(
      currentUserId,
      updateDataForCurrent
    );
    if (!updatedCurrentUser) {
      throw new NotFoundException('Current user not found during update');
    }
  
    const updatedContactUser = await this.userRepository.updateUser(
      contactUserId,
      updateDataForContact
    );
    if (!updatedContactUser) {
      throw new NotFoundException('Contact user not found during update');
    }
  
    return updatedCurrentUser;
  }
}
