import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { User } from './user.schema';
import { Types } from 'mongoose';
import { LastSeenVisibility } from './enums/lastSeenVisibility.enum';
import { PhotoVisibility } from './enums/profile-photo.enum';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  private readonly logger = new Logger(UsersService.name);

  async findOne(
    id: string,
    projection?: string | Record<string, 1 | 0>,
  ): Promise<Partial<User>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findUserById(id, projection);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async searchUsers(
    query: string,
    field: 'username' | 'phoneNumber' | 'country', // Restrict the field to valid options
    projection?: Record<string, 1>,
  ): Promise<Partial<User>[]> {
    return this.userRepository.searchUsers(query, field, projection);
  }

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

  async addContact(
    currentUserId: string,
    contactUserId: string,
  ): Promise<User> {
    if (!Types.ObjectId.isValid(currentUserId)) {
      throw new BadRequestException('Invalid current user ID');
    }
    if (!Types.ObjectId.isValid(contactUserId)) {
      throw new BadRequestException('Invalid contact user ID');
    }

    if (currentUserId === contactUserId) {
      throw new BadRequestException('Cannot add yourself as a contact');
    }

    const currentUser = await this.userRepository.findUserById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    const contactUser = await this.userRepository.findUserById(contactUserId);
    if (!contactUser) {
      throw new NotFoundException('Contact user not found');
    }

    const alreadyAddedToCurrent = currentUser.contacts.some(
      (contact) => contact.user?.toString() === contactUserId,
    );

    // Check if contact user exists in contact's list
    const contactUserContactIndex = contactUser.contacts.findIndex(
      (contact) => contact.user?.toString() === currentUserId,
    );
    const contactHasCurrentUser = contactUserContactIndex !== -1;

    // If both users already have each other in contacts, just make sure removedByContact is reset
    if (alreadyAddedToCurrent && contactHasCurrentUser) {
      // Reset the removedByContact flag if it was set
      if (contactUser.contacts[contactUserContactIndex].removedByContact) {
        const updatedContactsForContact = [...contactUser.contacts];
        updatedContactsForContact[contactUserContactIndex].removedByContact =
          false;

        await this.userRepository.updateUser(contactUserId, {
          contacts: updatedContactsForContact,
        });
      }
      return currentUser;
    }

    // Add or update contacts as needed
    const updatedContactsForCurrent = alreadyAddedToCurrent
      ? [...currentUser.contacts]
      : [
          ...currentUser.contacts,
          { user: contactUserId, blocked: false, removedByContact: false },
        ];

    // If the contact user already has current user, update to reset removedByContact flag
    let updatedContactsForContact;
    if (contactHasCurrentUser) {
      updatedContactsForContact = [...contactUser.contacts];
      updatedContactsForContact[contactUserContactIndex].removedByContact =
        false;
    } else {
      // Otherwise add the current user to the contact's list
      updatedContactsForContact = [
        ...contactUser.contacts,
        { user: currentUserId, blocked: false, removedByContact: false },
      ];
    }

    const updatedCurrentUser = await this.userRepository.updateUser(
      currentUserId,
      {
        contacts: updatedContactsForCurrent,
      },
    );
    if (!updatedCurrentUser) {
      throw new NotFoundException('Current user not found during update');
    }

    await this.userRepository.updateUser(contactUserId, {
      contacts: updatedContactsForContact,
    });

    return updatedCurrentUser;
  }

  async removeContact(
    currentUserId: string,
    contactUserId: string,
  ): Promise<User> {
    // Validate input IDs
    if (
      !Types.ObjectId.isValid(currentUserId) ||
      !Types.ObjectId.isValid(contactUserId)
    ) {
      throw new BadRequestException('Invalid user ID');
    }

    // Convert string IDs to ObjectIds for consistent comparison
    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const contactUserObjectId = new Types.ObjectId(contactUserId);

    // Find both users
    const currentUser = await this.userRepository.findUserById(currentUserId);
    const contactUser = await this.userRepository.findUserById(contactUserId);

    if (!currentUser || !contactUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUserId === contactUserId) {
      throw new BadRequestException('Cannot remove yourself as a contact');
    }

    // Find current user's contact by comparing ObjectIds
    const contactIndexInCurrent = currentUser.contacts.findIndex((contact) =>
      new Types.ObjectId(contact.user).equals(contactUserObjectId),
    );

    if (contactIndexInCurrent === -1) {
      throw new BadRequestException('Contact not found in your contact list');
    }

    // Find the current user in contact's list using ObjectId.equals()
    const contactIndexInContact = contactUser.contacts.findIndex((contact) =>
      new Types.ObjectId(contact.user).equals(currentUserObjectId),
    );

    // Remove contact from current user's list
    const updatedContactsForCurrent = [...currentUser.contacts];
    updatedContactsForCurrent.splice(contactIndexInCurrent, 1);

    // Update contact user if needed
    if (contactIndexInContact !== -1) {
      // Create a deep copy of the contacts array
      const contactsToUpdate = JSON.parse(JSON.stringify(contactUser.contacts));

      // Set the flag and ensure we're not modifying by reference
      contactsToUpdate[contactIndexInContact] = {
        ...contactsToUpdate[contactIndexInContact],
        removedByContact: true,
      };

      try {
        // Update the contact user
        await this.userRepository.updateUser(contactUserId, {
          contacts: contactsToUpdate,
        });
       
      } catch (error) {
        console.error('Error updating contact user:', error);
      }
    }

    // Update current user's contacts
    const updatedCurrentUser = await this.userRepository.updateUser(
      currentUserId,
      { contacts: updatedContactsForCurrent },
    );

    if (!updatedCurrentUser) {
      throw new NotFoundException('Current user not found during update');
    }

    return updatedCurrentUser;
  }
}
