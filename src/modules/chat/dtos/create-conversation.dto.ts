import { IsBoolean, IsOptional, IsNotEmpty, IsMongoId, IsArray, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: 'First participant of the conversation',
    example: '60f7c7e3d6e0b441d8b5d5a9',
  })
  @IsMongoId()
  @IsNotEmpty()
  participant1: string;

  @ApiProperty({
    description: 'Second participant of the conversation',
    example: '60f7c7e3d6e0b441d8b5d5b0',
  })
  @IsMongoId()
  @IsNotEmpty()
  participant2: string;

  @ApiProperty({
    description: 'Indicates whether the conversation is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Last activity timestamp',
    required: false,
    example: '2023-08-15T12:34:56.789Z',
  })
  @IsDate()
  @IsOptional()
  lastActivityAt?: Date;

  @ApiProperty({
    description: 'ID of the last message in the conversation',
    required: false,
    example: '60f7c7e3d6e0b441d8b5d5c2',
  })
  @IsMongoId()
  @IsOptional()
  lastMessage?: string;

  @ApiProperty({
    description: 'Users who have blocked this conversation',
    required: false,
    example: ['60f7c7e3d6e0b441d8b5d5d3'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  blockedBy?: string[];

  @ApiProperty({
    description: 'Timestamp map of last read messages per user',
    required: false,
    example: { '60f7c7e3d6e0b441d8b5d5a9': '2023-08-15T12:34:56.789Z' },
  })
  @IsOptional()
  lastReadAt?: Record<string, Date>;

  @ApiProperty({
    description: 'Indicates if the conversation is archived',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean = false;

  @ApiProperty({
    description: 'Total number of messages in the conversation',
    example: 50,
  })
  @IsOptional()
  messageCount?: number = 0;
}
