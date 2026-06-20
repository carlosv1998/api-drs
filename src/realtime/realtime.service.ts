import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealtimeGateway } from './realtime.gateway';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

@Injectable()
export class RealtimeService {
  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly prisma: PrismaService,
  ) {}

  // ── Emit methods ───────────────────────────────────────────

  /** Broadcast to every connected socket, regardless of user or permissions. */
  emitToAll(event: string, payload: unknown) {
    this.gateway.emitToAll(event, payload);
  }

  /** Emit to all sockets belonging to a single user. */
  emitToUser(userId: string, event: string, payload: unknown) {
    this.gateway.emitToUser(userId, event, payload);
  }

  /** Emit to all sockets belonging to a list of users. */
  emitToUsers(userIds: string[], event: string, payload: unknown) {
    this.gateway.emitToUsers(userIds, event, payload);
  }

  /**
   * Emit to all users who hold at least one of the given SCOPE_NAMEs.
   * Respects the effective-scope logic: roles + allowedScopes − deniedScopes.
   */
  async emitToScopes(scopes: SCOPE_NAME[], event: string, payload: unknown) {
    const userIds = await this.resolveUserIdsByScopes(scopes);
    this.gateway.emitToUsers(userIds, event, payload);
  }

  // ── Scope resolution ───────────────────────────────────────

  /**
   * Returns the IDs of all users who hold at least one of the given SCOPE_NAMEs.
   * Exported so that other services (e.g. NotificationsService) can reuse it.
   */
  async resolveUserIdsByScopes(scopeNames: SCOPE_NAME[]): Promise<string[]> {
    if (scopeNames.length === 0) return [];

    // 1. Resolve Scope document IDs from the SCOPE_NAME enum values
    const scopeDocs = await this.prisma.scope.findMany({
      where: { name: { in: scopeNames }, enabled: true },
      select: { id: true },
    });
    const scopeIds = scopeDocs.map((s) => s.id);
    if (scopeIds.length === 0) return [];

    // 2. Find Role IDs that grant any of those scopes via their scopeList
    const roleDocs = await this.prisma.role.findMany({
      where: { scopeList: { hasSome: scopeIds } },
      select: { id: true },
    });
    const roleIds = roleDocs.map((r) => r.id);

    // 3. Find Permission records where the user holds the scope (directly or via role)
    //    but has NOT had the scope explicitly denied.
    const matchingPermissions = await this.prisma.permission.findMany({
      where: {
        OR: [
          ...(scopeIds.length > 0 ? [{ allowedScopes: { hasSome: scopeIds } }] : []),
          ...(roleIds.length > 0  ? [{ roles:         { hasSome: roleIds  } }] : []),
        ],
        NOT: { deniedScopes: { hasSome: scopeIds } },
      },
      select: { userId: true },
    });

    return matchingPermissions.map((p) => p.userId);
  }
}
