import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export interface CreateUserDto {
  email: string;
  name?: string;
}

export interface UpdateUserDto {
  name?: string;
  discordWebhook?: string;
  language?: 'ja' | 'en';
}

@Injectable()
export class AuthService {
  // メール認証トークンの生成
  async createVerificationToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間有効

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    return token;
  }

  // メール認証トークンの検証
  async verifyToken(token: string): Promise<string | null> {
    const verification = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verification) {
      return null;
    }

    if (verification.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return null;
    }

    // トークンを削除
    await prisma.verificationToken.delete({ where: { token } });

    return verification.identifier;
  }

  // ユーザー作成
  async createUser(dto: CreateUserDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    return prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
      },
    });
  }

  // ユーザー取得（メールで）
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { alerts: true },
    });
  }

  // ユーザー取得（IDで）
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { alerts: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  // ユーザー更新
  async updateUser(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    return prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  // Push Subscription の保存
  async savePushSubscription(userId: string, subscription: unknown) {
    return prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: subscription as object },
    });
  }

  // Discord Webhook の保存
  async saveDiscordWebhook(userId: string, webhookUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { discordWebhook: webhookUrl },
    });
  }

  // メール認証完了
  async verifyEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
  }

  // 全ユーザー取得（管理用）
  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        language: true,
        createdAt: true,
        _count: {
          select: { alerts: true },
        },
      },
    });
  }
}
