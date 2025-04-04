import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { LastSeenVisibility } from '../enums/lastSeenVisibility.enum';
import { PhotoVisibility } from '../enums/profile-photo.enum';
import { Type } from 'class-transformer';
import { Country } from '../enums/countries.enum';

class PrivacySettingsDto {
  @IsEnum(LastSeenVisibility)
  @IsOptional()
  lastSeenVisibility?: LastSeenVisibility;

  @IsEnum(PhotoVisibility)
  @IsOptional()
  profilePhotoVisibility?: PhotoVisibility;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  country: Country;

  @IsOptional()
  @IsString()
  profilePic?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  lastSeen?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacySettings?: {
    lastSeenVisibility?: LastSeenVisibility;
    profilePhotoVisibility?: PhotoVisibility;
  };
}
