import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

// DTO for blocking/unblocking
export class BlockUnblockUserDto {
  @ApiProperty({
    description: 'First participant of the conversation',
    example: '60f7c7e3d6e0b441d8b5d5a9',
  })
  @IsNotEmpty()
  targetUserId: Types.ObjectId;
}
