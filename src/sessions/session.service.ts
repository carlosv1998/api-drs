import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { envs } from 'src/config/envs';

export interface CreateSessionData {
  userId: string;
  deviceType: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSessionData) {
    await this.enforceMaxSessions(data.userId);

    const expiresAt = new Date(Date.now() + envs.tokens.refreshTokenExpiration);
    return this.prisma.session.create({ data: { ...data, expiresAt } });
  }

  async findById(id: string) {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceType: true,
        deviceName: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async updateLastActive(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.session.delete({ where: { id } }).catch(() => null);
  }

  async deleteAllByUserId(userId: string, exceptSessionId?: string) {
    return this.prisma.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
    });
  }

  private async enforceMaxSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const overflow = sessions.length - envs.auth.maxSessionsPerUser + 1;
    if (overflow > 0) {
      const toDelete = sessions.slice(0, overflow).map((s) => s.id);
      await this.prisma.session.deleteMany({ where: { id: { in: toDelete } } });
    }
  }
}
