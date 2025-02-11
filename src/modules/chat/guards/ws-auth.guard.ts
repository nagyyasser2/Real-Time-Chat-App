import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const token = client.handshake.auth.token;

        if (!token) {
            throw new WsException('Authentication token not provided');
        }

        try {
            // Implement your token verification logic here
            // const payload = await this.jwtService.verify(token);
            // client.handshake.auth.userId = payload.sub;
            return true;
        } catch (err) {
            throw new WsException('Invalid authentication token');
        }
    }
}