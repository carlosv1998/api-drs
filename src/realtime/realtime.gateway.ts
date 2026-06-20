import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/realtime' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  // userId → Set of socketIds (a user can have multiple connected devices)
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth?.token as string) ??
        (client.handshake.headers?.authorization as string) ??
        '';
      const token = raw.replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify<{ sub: string }>(token);

      client.data.userId = payload.sub;
      const sockets = this.userSockets.get(payload.sub) ?? new Set<string>();
      sockets.add(client.id);
      this.userSockets.set(payload.sub, sockets);

      this.logger.log(`Connected: ${client.id} (user ${payload.sub})`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Disconnected: ${client.id}`);
  }

  emitToAll(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  emitToUsers(userIds: string[], event: string, payload: unknown) {
    for (const userId of userIds) {
      this.emitToUser(userId, event, payload);
    }
  }

  getConnectedUserIds(): string[] {
    return [...this.userSockets.keys()];
  }
}
