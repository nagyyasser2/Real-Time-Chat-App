import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './repositories/user.repository';
import { User } from './schemas/user.schema';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) { }
  create(createUserDto: CreateUserDto) {

    return 'This action adds a new user';
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = this.userRepository.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    return `This action removes a #${id} user`;
  }
}
