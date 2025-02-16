import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsEnum,
    ValidateNested,
    IsMongoId,
    IsArray,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../enums/message-type.enum';

class MediaDto {
    @IsNotEmpty()
    @IsString()
    url: string;

    @IsNotEmpty()
    @IsString()
    type: string;

    @IsOptional()
    @IsString()
    caption?: string;
}

class ContentDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaDto)
    media?: MediaDto[];
}

export class SendMessageDto {
    @IsNotEmpty()
    @IsMongoId()
    conversationId: string;

    @IsNotEmpty()
    @IsMongoId()
    senderId: string;

    @IsNotEmpty()
    @IsMongoId()
    receiverId: string;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => ContentDto)
    content: ContentDto;

    @IsNotEmpty()
    @IsEnum(MessageType)
    type: MessageType;

    @IsOptional()
    @IsMongoId()
    parentMessageId?: string;
}
