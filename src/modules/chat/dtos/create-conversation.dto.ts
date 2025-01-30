import {
    IsEnum,
    IsString,
    IsOptional,
    IsBoolean,
    IsNotEmpty,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { ConversationType } from '../enums/conv-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
    @ApiProperty({
        enum: ConversationType,
        description: 'Type of conversation',
        example: ConversationType.GROUP,
    })
    @IsEnum(ConversationType)
    @IsNotEmpty()
    type: ConversationType;

    @ApiProperty({
        description: 'Unique name for the conversation',
        example: 'project-team-chat',
        maxLength: 50,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ValidateIf(o => o.type !== ConversationType.PRIVATE)
    name: string;

    @ApiProperty({
        description: 'Conversation description',
        required: false,
        example: 'Team communication channel',
        maxLength: 200,
    })
    @IsString()
    @MaxLength(200)
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'URL to conversation avatar image',
        required: false,
        example: 'https://example.com/avatar.jpg',
    })
    @IsString()
    @IsOptional()
    avatar?: string;

    @ApiProperty({
        description: 'Indicates if this is a broadcast channel',
        required: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    isBroadcast?: boolean = false;

    @ApiProperty({
        description: 'Initial participants (must include creator)',
        required: false,
        example: ['user-id-1', 'user-id-2'],
    })
    @IsString({ each: true })
    @IsOptional()
    participants?: string[];
}