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
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.schema';
import { LastSeenVisibility } from './enums/lastSeenVisibility.enum';
import { PhotoVisibility } from './enums/profile-photo.enum';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('search')
  async searchUsers(
    @Query('q') q: string,
    @Query('field') field: 'username' | 'phoneNumber' | 'country', // Restrict to valid fields
    @Query('fields') fields?: string, // Optional projection fields
  ): Promise<Partial<User>[]> {
    if (!q) {
      throw new BadRequestException('Search query (q) is required');
    }
    if (!field || !['username', 'phoneNumber', 'country'].includes(field)) {
      throw new BadRequestException('Invalid field');
    }

    // Create projection object for selecting specific fields (optional)
    const projection: Record<string, 1> | undefined = fields
      ? fields.split(',').reduce(
          (acc, field) => {
            acc[field.trim()] = 1;
            return acc;
          },
          {} as Record<string, 1>,
        )
      : undefined;

    return this.usersService.searchUsers(q, field, projection);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('fields') fields?: string,
  ): Promise<Partial<User>> {
    const projection = fields
      ? fields.split(',').reduce(
          (acc, field) => {
            acc[field.trim()] = 1;
            return acc;
          },
          {} as Record<string, 1>,
        )
      : undefined;

    return this.usersService.findOne(id, projection);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removeContact(@Param('id') id: string, @CurrentUser() user) {
    await this.usersService.removeContact(user._id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(
    @CurrentUser() user,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user._id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<User> {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile-pic')
  @UseInterceptors(
    FileInterceptor('profilePic', {
      storage: diskStorage({
        destination: './uploads/profile-pics',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async updateProfilePic(
    @CurrentUser() user,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    if (!file) {
      throw new BadRequestException('Profile picture is required');
    }
    // Create URL for the saved file
    const profilePicUrl = `${process.env.APP_URL}/uploads/profile-pics/${file.filename}`;

    // Save the URL to database
    return await this.usersService.updateProfilePic(user._id, profilePicUrl);
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

  @UseGuards(JwtAuthGuard)
  @Put('last-seen')
  async updateLastSeen(@CurrentUser() user): Promise<any> {
    return this.usersService.updateLastSeen(user._id);
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
}
