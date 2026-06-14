import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        priority: data.priority,
        description: data.description,
        scopeList: data.scopeList ?? [],
        enabled: data.enabled ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  findByIds(ids: string[]) {
    return this.prisma.role.findMany({
      where: { id: { in: ids }, enabled: true },
    });
  }

  update(id: string, data: UpdateRoleDto) {
    return this.prisma.role.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }
}
