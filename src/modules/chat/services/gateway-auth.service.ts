// import { Injectable, Logger } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { JwtService } from "@nestjs/jwt";
// import { Socket } from "socket.io";


// @Injectable()
// export class GatewayAuthService {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly configService: ConfigService
//   ) {}

//   private readonly logger = new Logger("ChatGateway");

//   async authenticateClient(client: Socket): Promise<string | null> {
//     const authHeader = client.handshake.headers.authorization;
//     const token = client.handshake.auth?.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    
//     if (!token) {
//       this.logger.error('Authentication token not provided');
      
//       return null;
//     }

//     try {
//       const payload = await this.jwtService.verifyAsync(token, {
//         secret: this.configService.get('jwt')?.secret,
//       });
//       const userId = payload.sub;
//       client.data = { userId };
//       return userId;
//   }
//   catch{

//   }
// }

// // chat.gateway.ts
// @WebSocketGateway({ namespace: 'chat' })
// export class ChatGateway implements OnGatewayConnection {
//   constructor(
//     private readonly gatewayAuthService: GatewayAuthService,
//     private readonly chatService: ChatService
//   ) {}
  
//   async handleConnection(client: Socket) {
//     const userId = await this.gatewayAuthService.authenticateClient(client);
//     if (!userId) {
//       client.disconnect();
//       return;
//     }
//     // Chat-specific logic
//   }
// }