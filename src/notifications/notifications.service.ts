import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealtimeService } from 'src/realtime/realtime.service';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';
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

export interface SendNotificationToScopesParams {
  scopes: SCOPE_NAME[];
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
    private readonly realtime: RealtimeService,
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

  /** Send a persisted notification (DB + WebSocket + push) to explicit user IDs. */
  async send({ userIds, type, title, body, route, payload }: SendNotificationParams) {
    if (userIds.length === 0) return;

    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId, type, title, body, route,
        payload: payload as Prisma.InputJsonValue ?? Prisma.JsonNull,
      })),
    });

    const notificationEvent = { type, title, body, route, payload };
    this.realtime.emitToUsers(userIds, 'notification', notificationEvent);

    await this.sendExpoPush(userIds, { title, body, route, payload });
  }

  /** Send a persisted notification (DB + WebSocket + push) to all users with any of the given scopes. */
  async sendToScopes({ scopes, ...rest }: SendNotificationToScopesParams) {
    const userIds = await this.realtime.resolveUserIdsByScopes(scopes);
    return this.send({ userIds, ...rest });
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
