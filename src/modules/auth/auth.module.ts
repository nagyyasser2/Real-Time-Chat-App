import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/services/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { IConfig } from '../../config/interfaces/config.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../shared/guards/strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/auth.guard';

@Module({
  imports: [UsersModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService<IConfig>) => ({
      secret: configService.get('jwt').secret,
      signOptions: { expiresIn: configService.get('jwt').expiresIn },
    }),
    global: true,
    inject: [ConfigService],
  })],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    JwtService,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, JwtStrategy],
})
export class AuthModule { }
