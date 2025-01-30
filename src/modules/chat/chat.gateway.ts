import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './services/messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat'
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: MessagesService) { }

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    client.emit('leftRoom', room);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    // const savedMessage = await this.chatService.saveMessage(data);
    // this.server.to(data.room).emit('message', savedMessage);
  }
}
