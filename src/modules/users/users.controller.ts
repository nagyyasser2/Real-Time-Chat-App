import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { LastSeenVisibility } from './enums/lastSeenVisibility.enum';
import { PhotoVisibility } from './enums/profile-photo.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<User> {
    return this.usersService.remove(id);
  }

  @Patch(':id/profile-pic')
  async updateProfilePic(
    @Param('id') id: string,
    @Body('profilePicUrl') profilePicUrl: string,
  ): Promise<User> {
    if (!profilePicUrl) {
      throw new BadRequestException('profilePicUrl is required');
    }
    return this.usersService.updateProfilePic(id, profilePicUrl);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<User> {
    if (!status) {
      throw new BadRequestException('status is required');
    }
    return this.usersService.updateStatus(id, status);
  }

  @Put(':id/last-seen')
  async updateLastSeen(@Param('id') id: string): Promise<User> {
    return this.usersService.updateLastSeen(id);
  }

  @Patch(':id/privacy-settings')
  async updatePrivacySettings(
    @Param('id') id: string,
    @Body()
    privacySettings: {
      lastSeenVisibility?: LastSeenVisibility;
      profilePhotoVisibility?: PhotoVisibility;
    },
  ): Promise<User> {
    if (!privacySettings || Object.keys(privacySettings).length === 0) {
      throw new BadRequestException('Privacy settings required');
    }
    return this.usersService.updatePrivacySettings(id, privacySettings);
  }

  @Get('search/phone')
  async findByPhoneNumber(@Query('number') phoneNumber: string): Promise<User> {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get('search/username')
  async findByUsername(@Query('username') username: string): Promise<User> {
    if (!username) {
      throw new BadRequestException('Username is required');
    }
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
