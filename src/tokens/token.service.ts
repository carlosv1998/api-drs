import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { TOKEN_TYPE } from 'src/common/enums/token-type.enum';
import {
  CustomBadRequestException,
  CustomUnauthorizedException,
} from 'src/common/exceptions/custom-exceptions';
import { TOKEN_ERRORS } from './errors';

interface EmailVerificationPayload {
  sub: string;
  type: string;
  tokenId: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // --- Web: JWT link ---

  async createEmailVerificationToken(userId: string): Promise<string> {
    await this.prisma.token.deleteMany({
      where: { userId, type: TOKEN_TYPE.EMAIL_VERIFICATION },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const record = await this.prisma.token.create({
      data: { userId, type: TOKEN_TYPE.EMAIL_VERIFICATION, expiresAt },
    });

    return this.jwtService.sign(
      { sub: userId, type: TOKEN_TYPE.EMAIL_VERIFICATION, tokenId: record.id },
      { expiresIn: '24h' },
    );
  }

  async validateEmailVerificationToken(token: string): Promise<string> {
    let payload: EmailVerificationPayload;

    try {
      payload = this.jwtService.verify<EmailVerificationPayload>(token);
    } catch {
      throw new CustomUnauthorizedException(
        'Invalid or expired token',
        TOKEN_ERRORS.INVALID_TOKEN,
      );
    }

    if (payload.type !== TOKEN_TYPE.EMAIL_VERIFICATION) {
      throw new CustomBadRequestException(
        'Invalid token type',
        TOKEN_ERRORS.INVALID_TOKEN_TYPE,
      );
    }

    const record = await this.prisma.token.findUnique({
      where: { id: payload.tokenId },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) await this.prisma.token.delete({ where: { id: record.id } });
      throw new CustomBadRequestException(
        'Token not found or expired',
        TOKEN_ERRORS.TOKEN_NOT_FOUND,
      );
    }

    await this.prisma.token.delete({ where: { id: record.id } });
    return record.userId;
  }

  // --- Mobile: 6-digit OTP code ---

  async createEmailVerificationCode(userId: string): Promise<string> {
    await this.prisma.token.deleteMany({
      where: { userId, type: TOKEN_TYPE.EMAIL_VERIFICATION },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.token.create({
      data: {
        userId,
        type: TOKEN_TYPE.EMAIL_VERIFICATION,
        value: hashedCode,
        expiresAt,
      },
    });

    return code;
  }

  async validateEmailVerificationCode(userId: string, code: string): Promise<void> {
    const record = await this.prisma.token.findFirst({
      where: { userId, type: TOKEN_TYPE.EMAIL_VERIFICATION },
    });

    if (!record || !record.value) {
      throw new CustomBadRequestException(
        'Code not found',
        TOKEN_ERRORS.TOKEN_NOT_FOUND,
      );
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.token.delete({ where: { id: record.id } });
      throw new CustomBadRequestException(
        'Code has expired',
        TOKEN_ERRORS.TOKEN_NOT_FOUND,
      );
    }

    const isValid = await bcrypt.compare(code, record.value);
    if (!isValid) {
      throw new CustomBadRequestException(
        'Invalid code',
        TOKEN_ERRORS.INVALID_TOKEN,
      );
    }

    await this.prisma.token.delete({ where: { id: record.id } });
  }
}
