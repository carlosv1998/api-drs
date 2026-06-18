import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { PaginationDto } from 'src/common/dtos/filter.dto';
import { PrismaHelper } from 'src/common/helpers/prisma.helper';

export interface SendNotificationParams {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  route?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ── Push token ─────────────────────────────────────────────

  async registerPushToken(userId: string, token: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token },
      update: { userId },
    });
  }

  async removePushToken(token: string) {
    return this.prisma.pushToken.delete({ where: { token } }).catch(() => null);
  }

  // ── Enviar notificación ────────────────────────────────────

  async send({ userIds, type, title, body, route, payload }: SendNotificationParams) {
    if (userIds.length === 0) return;

    // 1. Crear registros en BD para todos los destinatarios
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId, type, title, body, route,
        payload: payload as Prisma.InputJsonValue ?? Prisma.JsonNull,
      })),
    });

    // 2. Emitir por WebSocket a usuarios conectados
    const notificationEvent = { type, title, body, route, payload };
    this.gateway.emitToUsers(userIds, 'notification', notificationEvent);

    // 3. Enviar push nativa via Expo a dispositivos registrados
    await this.sendExpoPush(userIds, { title, body, route, payload });
  }

  // ── Consultas ──────────────────────────────────────────────

  async findAll(userId: string, paginationDto: PaginationDto) {
    return PrismaHelper.paginate(
      (args) => this.prisma.notification.findMany({ ...args, where: { userId }, orderBy: { createdAt: 'desc' } }),
      (args) => this.prisma.notification.count({ ...args, where: { userId } }),
      paginationDto,
    );
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  // ── Helpers internos ───────────────────────────────────────

  private async sendExpoPush(
    userIds: string[],
    data: { title: string; body: string; route?: string; payload?: Record<string, unknown> },
  ) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default' as const,
        title: data.title,
        body: data.body,
        data: { route: data.route, ...(data.payload ?? {}) },
      }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk).catch((err) => {
        this.logger.error('Expo push error', err);
      });
    }
  }
}
