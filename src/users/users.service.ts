import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterDto, PaginationDto } from 'src/common/dtos/filter.dto';
import { PrismaHelper } from 'src/common/helpers/prisma.helper';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CustomBadRequestException } from 'src/common/exceptions/custom-exceptions';
import { GcpStorageService } from 'src/documents/storage/gcp-storage.service';
import { envs } from 'src/config/envs';
import { USER_ERRORS } from './errors';
import { RequirePermissions } from 'src/permissions/decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: GcpStorageService,
  ) {}

  @RequirePermissions([SCOPE_NAME.PERMISSIONS_CREATE])
  async findAll(
    paginationDto: PaginationDto,
    filterDto?: FilterDto,
  ): Promise<IPaginatedResponse<User & { permission: { jobTitle: string } | null }>> {
    const where = PrismaHelper.buildWhere(filterDto, [
      'firstName',
      'lastName',
      'email',
      'rut',
    ]);
    const orderBy = PrismaHelper.buildOrderBy(filterDto);

    const result = await PrismaHelper.paginate(
      (args) => this.prisma.user.findMany({
        ...args,
        include: { permission: { select: { jobTitle: true } } },
      }) as Promise<(User & { permission: { jobTitle: string } | null })[]>,
      (args) => this.prisma.user.count(args),
      paginationDto,
      where,
      orderBy,
    );

    this.logger.log(`Users found: ${result.pagination.total}`);
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserDto): Promise<User> {

    const [existingEmail, existingRut] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: data.email } }),
      this.prisma.user.findUnique({ where: { rut: data.rut } }),
    ]);

    if (existingEmail) {
      throw new CustomBadRequestException(
        'Email already in use',
        USER_ERRORS.EMAIL_ALREADY_IN_USE,
      );
    }

    if (existingRut) {
      throw new CustomBadRequestException(
        'RUT already in use',
        USER_ERRORS.RUT_ALREADY_IN_USE,
      );
    }

    const user = await this.prisma.user.create({
      data: { ...data, emailVerified: false },
    });
    this.logger.log(`User created: ${user.id}`);
    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    const ext = file.mimetype.split('/')[1] ?? 'jpg';
    const filename = `profiles/images/${userId}.${ext}`;
    const url = await this.storageService.upload(file.buffer, filename, file.mimetype, envs.gcp.publicBucketName);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });
    this.logger.log(`Avatar uploaded for user: ${userId}`);
    return user;
  }

  async deleteAvatar(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (user.avatarUrl) {
      const filename = user.avatarUrl.split(`storage.googleapis.com/${envs.gcp.publicBucketName}/`)[1];
      await this.storageService.delete(filename, envs.gcp.publicBucketName).catch(() => {});
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    this.logger.log(`Avatar deleted for user: ${userId}`);
    return updated;
  }

  async uploadSignature(userId: string, file: Express.Multer.File): Promise<User> {
    const ext = file.mimetype.split('/')[1] ?? 'png';
    const filename = `signatures/${userId}.${ext}`;
    const url = await this.storageService.upload(file.buffer, filename, file.mimetype, envs.gcp.publicBucketName);

    const user = await this.prisma.user.update({ where: { id: userId }, data: { signatureUrl: url } });
    this.logger.log(`Signature uploaded for user: ${userId}`);
    return user;
  }

  async deleteSignature(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (user.signatureUrl) {
      const filename = user.signatureUrl.split(`storage.googleapis.com/${envs.gcp.publicBucketName}/`)[1];
      await this.storageService.delete(filename, envs.gcp.publicBucketName).catch(() => {});
    }
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { signatureUrl: null } });
    this.logger.log(`Signature deleted for user: ${userId}`);
    return updated;
  }

  async verifyEmail(userId: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
    this.logger.log(`Email verified for user: ${userId}`);
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    await this.findById(id);

    const user = await this.prisma.user.update({ where: { id }, data });
    this.logger.log(`User updated: ${id}`);
    return user;
  }

  async delete(id: string): Promise<User> {
    await this.findById(id);

    const user = await this.prisma.user.delete({ where: { id } });
    this.logger.log(`User deleted: ${id}`);
    return user;
  }
}
