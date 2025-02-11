import { IsNotEmpty, IsString, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MessageMetadata {
    @IsOptional()
    @IsString()
    fileName?: string;

    @IsOptional()
    @IsString()
    fileSize?: string;

    @IsOptional()
    @IsString()
    mimeType?: string;
}

export class SendMessageDto {
    @IsNotEmpty()
    @IsString()
    chatId: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsEnum(['text', 'image', 'file', 'system'])
    type: 'text' | 'image' | 'file' | 'system';

    @IsOptional()
    @IsString()
    replyTo?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => MessageMetadata)
    metadata?: MessageMetadata;
}
