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

    await this.sendExpoPush(userIds, { type, title, body, payload });
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
    data: { type: string; title: string; body: string; payload?: Record<string, unknown> },
  ) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });

    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t.token));

    const messages: ExpoPushMessage[] = validTokens.map((t) => ({
      to: t.token,
      sound: 'default' as const,
      title: data.title,
      body: data.body,
      data: { type: data.type, ...(data.payload ?? {}) },
    }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    const allTickets: Awaited<ReturnType<Expo['sendPushNotificationsAsync']>> = [];

    for (const chunk of chunks) {
      const tickets = await this.expo.sendPushNotificationsAsync(chunk).catch((err) => {
        this.logger.error('Expo push send error', err);
        return [] as typeof allTickets;
      });
      allTickets.push(...tickets);
    }

    await this.processReceipts(allTickets, validTokens.map((t) => t.token));
  }

  private async processReceipts(
    tickets: Awaited<ReturnType<Expo['sendPushNotificationsAsync']>>,
    tokens: string[],
  ) {
    const receiptIds: string[] = [];
    const tokenByIndex = new Map<number, string>();

    tickets.forEach((ticket, i) => {
      if (ticket.status === 'ok' && ticket.id) {
        receiptIds.push(ticket.id);
        tokenByIndex.set(receiptIds.length - 1, tokens[i]);
      } else if (ticket.status === 'error') {
        this.logger.warn(`Push ticket error for token ${tokens[i]}: ${ticket.message}`);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          this.removePushToken(tokens[i]).catch(() => null);
        }
      }
    });

    if (receiptIds.length === 0) return;

    const receiptChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptChunks) {
      const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk).catch((err) => {
        this.logger.error('Expo receipt fetch error', err);
        return {} as Awaited<ReturnType<Expo['getPushNotificationReceiptsAsync']>>;
      });

      for (const [receiptId, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'error') {
          this.logger.warn(`Push receipt error ${receiptId}: ${receipt.message}`);
          if (receipt.details?.error === 'DeviceNotRegistered') {
            const idx = receiptIds.indexOf(receiptId);
            const token = tokenByIndex.get(idx);
            if (token) this.removePushToken(token).catch(() => null);
          }
        }
      }
    }
  }
}
