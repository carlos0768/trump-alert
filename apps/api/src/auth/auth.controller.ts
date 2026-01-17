import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService, CreateUserDto, UpdateUserDto } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ユーザー登録（メール認証トークン発行）
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const user = await this.authService.createUser(dto);
    const token = await this.authService.createVerificationToken(dto.email);

    // 本番環境ではここでメールを送信
    // await emailService.sendVerificationEmail(dto.email, token);

    return {
      message: 'User created. Please check your email for verification.',
      userId: user.id,
      // 開発環境用：本番では返さない
      ...(process.env.NODE_ENV !== 'production' && {
        verificationToken: token,
      }),
    };
  }

  // メール認証確認
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const email = await this.authService.verifyToken(token);

    if (!email) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.authService.findByEmail(email);

    if (user) {
      await this.authService.verifyEmail(user.id);
    }

    return {
      message: 'Email verified successfully',
      email,
    };
  }

  // ログイン（メールベース）
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.authService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // マジックリンク用のトークン生成
    const token = await this.authService.createVerificationToken(email);

    // 本番環境ではここでメールを送信
    // await emailService.sendLoginEmail(email, token);

    return {
      message: 'Login link sent to your email',
      // 開発環境用：本番では返さない
      ...(process.env.NODE_ENV !== 'production' && { loginToken: token }),
    };
  }

  // ユーザー情報取得
  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    return this.authService.findById(id);
  }

  // ユーザーをメールで取得
  @Get('user/email/:email')
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.authService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  // ユーザー情報更新
  @Put('user/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  // Push Subscription 保存
  @Post('user/:id/push-subscription')
  async savePushSubscription(
    @Param('id') id: string,
    @Body('subscription') subscription: unknown
  ) {
    return this.authService.savePushSubscription(id, subscription);
  }

  // Discord Webhook 保存
  @Post('user/:id/discord-webhook')
  async saveDiscordWebhook(
    @Param('id') id: string,
    @Body('webhookUrl') webhookUrl: string
  ) {
    return this.authService.saveDiscordWebhook(id, webhookUrl);
  }

  // 全ユーザー取得（管理用）
  @Get('users')
  async getAllUsers() {
    return this.authService.findAll();
  }
}
