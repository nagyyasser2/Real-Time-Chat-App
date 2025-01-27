import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { IConfig } from '../../config/interfaces/config.interface';
import { TokenPayload, Tokens } from './interfaces/auth.interface';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<IConfig>,
  ) { }

  async signUp(createUserDto: CreateUserDto): Promise<Tokens> {
    const hashedPassword = await this.hashData(createUserDto.password);

    const user = await this.usersService.createUser({
      ...createUserDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user._id.toString(), tokens.refresh_token);

    return tokens;
  }

  async signIn(signInDto: SignInDto): Promise<Tokens> {
    const user = await this.validateCredentials(signInDto.identifier, signInDto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user._id.toString(), tokens.refresh_token);

    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(userId, tokens.refresh_token);

    return tokens;
  }

  async validateUser(payload: TokenPayload): Promise<User> {
    return this.usersService.findOne(payload.sub);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findOne(userId);
    const passwordMatches = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid password');

    const hashedPassword = await this.hashData(newPassword);
    await this.usersService.update(userId, { password: hashedPassword });
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.update(userId, { refreshToken: "" });
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const payload: TokenPayload = {
      sub: user._id.toString(),
      phoneNumber: user.phoneNumber,
      username: user.username,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt')?.secret,
        expiresIn: this.configService.get('jwt').accessExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt').refreshSecret,
        expiresIn: this.configService.get('jwt').refreshExpiration,
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  private async validateCredentials(
    identifier: string,
    password: string,
  ): Promise<User> {
    const user = await this.findUserByIdentifier(identifier);
    if (!user) throw new UnauthorizedException('User not found');

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid password');

    return user;
  }

  private async findUserByIdentifier(identifier: string): Promise<User> {
    const user = identifier.includes('@')
      ? await this.usersService.findByUsername(identifier)
      : await this.usersService.findByPhoneNumber(identifier)

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async hashData(data: string): Promise<string> {
    const saltOrRounds = this.configService.get('bcrypt').saltOrRounds;
    return bcrypt.hash(data, saltOrRounds);
  }
}