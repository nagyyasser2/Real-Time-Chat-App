// import { Injectable } from '@nestjs/common';
// import { ChatMessage } from '../interfaces/chat-message.interface';
// import { v4 as uuidv4 } from 'uuid';

// @Injectable()
// export class ChatService {
//   async saveMessage(senderId: string, receiverId: string, content: string, chatId: string): Promise<ChatMessage> {
//     // In a real application, this would save to your database
//     const message: ChatMessage = {
//       id: uuidv4(),
//       senderId,
//       receiverId,
//       content,
//       timestamp: new Date(),
//       chatId,
//     };
    
//     return message;
//   }

//   async markMessageAsDelivered(messageId: string): Promise<void> {
//     // Implement message delivery status update logic
//   }

//   async markMessageAsRead(messageId: string): Promise<void> {
//     // Implement message read status update logic
//   }
// }