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
import { EmailService } from '../notification/email.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService
  ) {}

  // ユーザー登録（メール認証コード発行）
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const user = await this.authService.createUser(dto);
    const code = await this.authService.createVerificationCode(dto.email);

    // Send verification email with code
    const emailSent = await this.emailService.sendVerificationCode({
      to: dto.email,
      code,
    });

    return {
      message: emailSent
        ? '確認コードをメールに送信しました。'
        : '確認コードを生成しました。',
      userId: user.id,
      email: dto.email,
      emailSent,
      // 開発環境用：メールが送れない場合のフォールバック
      ...(!emailSent && { code }),
    };
  }

  // メール認証確認（トークン方式 - メールリンク用）
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

  // メール認証確認（コード方式）
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body('email') email: string, @Body('code') code: string) {
    if (!email || !code) {
      throw new BadRequestException('Email and code are required');
    }

    const isValid = await this.authService.verifyCode(email, code);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired code');
    }

    const user = await this.authService.findByEmail(email);

    if (user) {
      await this.authService.verifyEmail(user.id);
    }

    return {
      message: 'Email verified successfully',
      email,
      user,
    };
  }

  // ログイン（メールベース - コード方式）
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

    // 6桁コードを生成
    const code = await this.authService.createVerificationCode(email);

    // Send login email with code
    const emailSent = await this.emailService.sendVerificationCode({
      to: email,
      code,
      isLogin: true,
    });

    return {
      message: emailSent
        ? 'ログインコードをメールに送信しました。'
        : 'ログインコードを生成しました。',
      email,
      emailSent,
      // 開発環境用：メールが送れない場合のフォールバック
      ...(!emailSent && { code }),
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
