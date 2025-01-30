import {
    IsMongoId,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ParticipantRole } from '../../chat/enums/participant-role.enum';
import { Types } from 'mongoose';

class CreateCustomNotificationsDto {
    @ApiProperty({
        description: 'Whether to mute notifications',
        required: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    mute: boolean = false; // Set default and remove optional (?) modifier

    @ApiProperty({
        description: 'Custom notification sound URL',
        required: false,
        example: 'https://example.com/sound.mp3',
    })
    @IsString()
    @IsOptional()
    customSound?: string;
}

export class CreateParticipantDto {
    @ApiProperty({
        description: 'Conversation ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsMongoId()
    conversation: Types.ObjectId;

    @ApiProperty({
        description: 'User ID',
        example: '507f191e810c19729de860ea',
    })
    @IsMongoId()
    user: Types.ObjectId;

    @ApiProperty({
        enum: ParticipantRole,
        description: 'Participant role',
        required: false,
        default: ParticipantRole.MEMBER,
    })
    @IsEnum(ParticipantRole)
    @IsOptional()
    role?: ParticipantRole = ParticipantRole.MEMBER;

    @ApiProperty({
        description: 'Custom notification settings',
        required: false,
        type: CreateCustomNotificationsDto,
    })
    @ValidateNested()
    @Type(() => CreateCustomNotificationsDto)
    @IsOptional()
    customNotifications?: CreateCustomNotificationsDto;
}