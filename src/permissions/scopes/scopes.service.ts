import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScopeDto } from './dtos/create-scope.dto';
import { UpdateScopeDto } from './dtos/update-scope.dto';

@Injectable()
export class ScopesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateScopeDto) {
    return this.prisma.scope.create({ data });
  }

  findAll() {
    return this.prisma.scope.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.scope.findUnique({ where: { id } });
  }

  findByNames(names: string[]) {
    return this.prisma.scope.findMany({
      where: { name: { in: names }, enabled: true },
    });
  }

  update(id: string, data: UpdateScopeDto) {
    return this.prisma.scope.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.scope.delete({ where: { id } });
  }
}
