import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { RolesService } from './roles/roles.service';
import { ScopesService } from './scopes/scopes.service';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';
import { CreateOrUpdatePermissionsDto } from './dtos/create-or-update-permissions.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
    private readonly scopesService: ScopesService,
    private readonly usersService: UsersService,
  ) {}

  async createOrUpdate(
    data: CreateOrUpdatePermissionsDto,
    assignedById: string,
  ): Promise<{ success: string[]; errors: { userId: string; reason: string }[] }> {
    const assignerPriority = await this.getUserMaxPriority(assignedById);

    const results = await Promise.all(
      data.userIds.map(async (userId) => {
        const targetPriority = await this.getUserMaxPriority(userId);

        if (assignerPriority < targetPriority) {
          return {
            type: 'error' as const,
            userId,
            reason: `Nivel insuficiente para modificar permisos de este usuario (nivel requerido: ${targetPriority}, nivel actual: ${assignerPriority})`,
          };
        }

        await this.prisma.permission.upsert({
          where: { userId },
          create: {
            userId,
            assignedById,
            roles: data.roles ?? [],
            allowedScopes: data.allowedScopes ?? [],
            deniedScopes: data.deniedScopes ?? [],
            jobTitle: data.jobTitle,
          },
          update: {
            assignedById,
            roles: data.roles ?? [],
            allowedScopes: data.allowedScopes ?? [],
            deniedScopes: data.deniedScopes ?? [],
            jobTitle: data.jobTitle,
          },
        });

        return { type: 'success' as const, userId };
      }),
    );

    return {
      success: results.filter((r) => r.type === 'success').map((r) => r.userId),
      errors: results
        .filter((r) => r.type === 'error')
        .map((r) => ({ userId: r.userId, reason: r.reason })),
    };
  }

  private async getUserMaxPriority(userId: string): Promise<number> {
    const permission = await this.prisma.permission.findUnique({ where: { userId } });
    if (!permission || permission.roles.length === 0) return 0;

    const roles = await this.rolesService.findByIds(permission.roles);
    if (roles.length === 0) return 0;

    return Math.max(...roles.map((r) => r.priority));
  }

  async findUserWithPermissions(userId: string) {
    const [user, permissions] = await Promise.all([
      this.usersService.findById(userId),
      this.findExpandedByUserId(userId),
    ]);

    const { ...profile } = user;

    return { user: profile, permissions };
  }

  findByUserId(userId: string) {
    return this.prisma.permission.findUnique({ where: { userId } });
  }

  async findExpandedByUserId(userId: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { userId },
    });

    if (!permission) return null;

    const roles = await this.rolesService.findByIds(permission.roles);

    const scopeIds = [
      ...new Set([
        ...permission.allowedScopes,
        ...permission.deniedScopes,
        ...roles.flatMap((role) => role.scopeList),
      ]),
    ];

    const scopes = await this.prisma.scope.findMany({
      where: {
        id: { in: scopeIds },
      },
    });

    const scopeById = new Map(scopes.map((scope) => [scope.id, scope]));

    return {
      ...permission,
      roles: roles.map((role) => ({
        ...role,
        scopeList: role.scopeList
          .map((id) => scopeById.get(id))
          .filter(Boolean),
      })),
      allowedScopes: permission.allowedScopes
        .map((id) => scopeById.get(id))
        .filter(Boolean),
      deniedScopes: permission.deniedScopes
        .map((id) => scopeById.get(id))
        .filter(Boolean),
    };
  }

  update(userId: string, data: UpdatePermissionDto) {
    return this.prisma.permission.update({ where: { userId }, data });
  }

  delete(userId: string) {
    return this.prisma.permission.delete({ where: { userId } });
  }

  async getEffectiveScopes(userId: string): Promise<{ name: string; module: string }[]> {
    const permission = await this.prisma.permission.findUnique({
      where: { userId },
    });
    if (!permission) return [];

    const roles =
      permission.roles.length > 0
        ? await this.rolesService.findByIds(permission.roles)
        : [];

    const roleScopeIds = roles.flatMap((r) => r.scopeList);
    const deniedSet = new Set(permission.deniedScopes);

    const effectiveScopeIds = [
      ...new Set(
        [...roleScopeIds, ...permission.allowedScopes].filter(
          (id) => !deniedSet.has(id),
        ),
      ),
    ];

    if (effectiveScopeIds.length === 0) return [];

    return this.prisma.scope.findMany({
      where: { id: { in: effectiveScopeIds }, enabled: true },
      select: { name: true, module: true },
    });
  }

  async hasAnyScope(userId: string, scopeNames: SCOPE_NAME[]): Promise<boolean> {
    const scopes = await this.scopesService.findByNames(scopeNames);
    if (scopes.length === 0) return false;
    const requiredIds = new Set(scopes.map((s) => s.id));

    const permission = await this.prisma.permission.findUnique({
      where: { userId },

    });
    if (!permission) return false;

    const roles =
      permission.roles.length > 0
        ? await this.rolesService.findByIds(permission.roles)
        : [];

    const roleScopeIds = roles.flatMap((r) => r.scopeList);
    const deniedSet = new Set(permission.deniedScopes);

    const effectiveScopes = new Set(
      [...roleScopeIds, ...permission.allowedScopes].filter(
        (id) => !deniedSet.has(id),
      ),
    );

    return [...requiredIds].some((id) => effectiveScopes.has(id));
  }
}
