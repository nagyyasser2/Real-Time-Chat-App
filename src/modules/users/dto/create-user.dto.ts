import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum LastSeenVisibility {
    EVERYONE = 'everyone',
    CONTACTS = 'contacts',
    NOBODY = 'nobody',
}

export enum ProfilePhotoVisibility {
    EVERYONE = 'everyone',
    CONTACTS = 'contacts',
    NOBODY = 'nobody',
}

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    phoneNumber: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    profilePic?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    lastSeen?: Date;

    @IsOptional()
    privacySettings?: {
        lastSeenVisibility?: LastSeenVisibility;
        profilePhotoVisibility?: ProfilePhotoVisibility;
    };
}