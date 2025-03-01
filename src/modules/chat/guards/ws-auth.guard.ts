import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { IConfig } from 'src/config/interfaces/config.interface';

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<IConfig>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        
        const authHeader = client.handshake.headers.authorization;
        const token = client.handshake.auth?.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
        
        console.log(token);
        
        if (!token) {
            throw new WsException('Authentication token not provided');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('jwt')?.secret,
            });

            console.log(payload)
            client.data.userId = payload.sub;

            return true;
        } catch (err) {
            throw new WsException('Invalid authentication token');
        }
    }
}
