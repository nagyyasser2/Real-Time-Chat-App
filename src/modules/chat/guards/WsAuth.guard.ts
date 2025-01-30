import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const token = client.handshake.query.token;

        if (typeof token === 'string') {
            return this.validateToken(token);
        }
        return false;
    }

    validateToken(token: string): boolean {
        // Implement token validation logic
        return true; // Return true if valid, false otherwise
    }
}
