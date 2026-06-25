import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterDto, PaginationDto } from 'src/common/dtos/filter.dto';
import { PrismaHelper } from 'src/common/helpers/prisma.helper';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { CustomBadRequestException } from 'src/common/exceptions/custom-exceptions';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleBaseBodyDto } from './dtos/update-vehicle-base-body.dto';
import { AddMaintenanceBodyDto } from './dtos/add-maintenance-body.dto';
import { UpdateMaintenanceBodyDto } from './dtos/update-maintenance-body.dto';
import { VEHICLE_ERRORS } from './errors';
import { GcpStorageService } from 'src/documents/storage/gcp-storage.service';
import { envs } from 'src/config/envs';

const VEHICLE_INCLUDE = {
  maintenances: {
    orderBy: { performedAt: 'desc' as const },
    include: {
      createdBy: {
        select: {
          firstName: true, lastName: true, avatarUrl: true, email: true,
          permission: { select: { jobTitle: true } },
        },
      },
    },
  },
};

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: GcpStorageService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filterDto?: FilterDto,
  ): Promise<IPaginatedResponse<any>> {
    const where = PrismaHelper.buildWhere(filterDto, ['patent']);
    const orderBy = PrismaHelper.buildOrderBy(filterDto);

    const result = await PrismaHelper.paginate(
      (args) => this.prisma.vehicle.findMany({ ...args, include: VEHICLE_INCLUDE }),
      (args) => this.prisma.vehicle.count(args),
      paginationDto,
      where,
      orderBy,
    );

    this.logger.log(`Vehicles found: ${result.pagination.total}`);
    return result;
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: VEHICLE_INCLUDE,
    });

    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async create(dto: CreateVehicleDto, files: Express.Multer.File[] = []) {
    const existing = await this.prisma.vehicle.findUnique({ where: { patent: dto.patent } });

    if (existing) {
      throw new CustomBadRequestException('Patent already in use', VEHICLE_ERRORS.PATENT_ALREADY_IN_USE);
    }

    const imageUrls = await Promise.all(
      files.map((file) =>
        this.storageService.upload(
          file.buffer,
          this.buildVehicleImageFilename(dto.patent, file.mimetype),
          file.mimetype,
          envs.gcp.publicBucketName,
        ),
      ),
    );

    const vehicle = await this.prisma.vehicle.create({
      data: {
        patent: dto.patent,
        type: dto.type,
        mileage: dto.mileage ?? 0,
        nextMaintenance: dto.nextMaintenance ? new Date(dto.nextMaintenance) : null,
        maintainMileageInterval: dto.maintainMileageInterval ?? null,
        imageUrls,
      },
      include: VEHICLE_INCLUDE,
    });

    this.logger.log(`Vehicle created: ${vehicle.id}`);
    return vehicle;
  }

  async updateBase(
    id: string,
    userId: string,
    dto: UpdateVehicleBaseBodyDto,
    files: Express.Multer.File[],
  ) {
    const vehicle = await this.findById(id);

    let imageUrls = vehicle.imageUrls;
    if (dto.imageUrls !== undefined || files.length > 0) {
      const keepUrls = dto.imageUrls ?? vehicle.imageUrls;
      const removedUrls = vehicle.imageUrls.filter((url) => !keepUrls.includes(url));
      await this.deleteGcpImages(removedUrls);

      const uploadedUrls = await Promise.all(
        files.map((file) =>
          this.storageService.upload(
            file.buffer,
            this.buildVehicleImageFilename(vehicle.patent, file.mimetype),
            file.mimetype,
            envs.gcp.publicBucketName,
          ),
        ),
      );

      imageUrls = [...keepUrls, ...uploadedUrls];
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.mileage !== undefined && { mileage: dto.mileage }),
        ...(dto.nextMaintenance !== undefined && {
          nextMaintenance: new Date(dto.nextMaintenance),
        }),
        ...(dto.maintainMileageInterval !== undefined && {
          maintainMileageInterval: dto.maintainMileageInterval,
        }),
        imageUrls,
        updatedById: userId,
        lastUpdate: new Date(),
      },
      include: VEHICLE_INCLUDE,
    });

    this.logger.log(`Vehicle updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const vehicle = await this.findById(id);

    const allImageUrls = [
      ...vehicle.imageUrls,
      ...vehicle.maintenances.flatMap((m) => m.imageUrls),
    ];
    await this.deleteGcpImages(allImageUrls);

    await this.prisma.vehicleMaintenance.deleteMany({ where: { vehicleId: id } });
    await this.prisma.vehicle.delete({ where: { id } });

    this.logger.log(`Vehicle deleted: ${id} (${allImageUrls.length} images removed)`);
  }

  async addMaintenance(
    vehicleId: string,
    userId: string,
    dto: AddMaintenanceBodyDto,
    files: Express.Multer.File[],
  ) {
    const vehicle = await this.findById(vehicleId);

    if (dto.mileageAtService < vehicle.mileage) {
      throw new CustomBadRequestException(
        'Mileage below vehicle current mileage',
        VEHICLE_ERRORS.MILEAGE_BELOW_VEHICLE,
      );
    }

    const imageUrls = await Promise.all(
      files.map((file) =>
        this.storageService.upload(
          file.buffer,
          this.buildMaintenanceFilename(vehicle.patent, dto.performedAt, file.mimetype),
          file.mimetype,
          envs.gcp.publicBucketName,
        ),
      ),
    );

    await this.prisma.vehicleMaintenance.create({
      data: {
        vehicleId,
        performedAt: new Date(dto.performedAt),
        mileageAtService: dto.mileageAtService,
        notes: dto.notes ?? null,
        imageUrls,
        createdById: userId,
      },
    });

    this.logger.log(`Maintenance added to vehicle ${vehicleId} with ${imageUrls.length} images`);
    return this.findById(vehicleId);
  }

  async updateMaintenanceFull(
    vehicleId: string,
    maintenanceId: string,
    dto: UpdateMaintenanceBodyDto,
    files: Express.Multer.File[],
  ) {
    const maintenance = await this.prisma.vehicleMaintenance.findFirst({
      where: { id: maintenanceId, vehicleId },
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record ${maintenanceId} not found`);
    }

    const vehicle = await this.findById(vehicleId);
    const newMileage = dto.mileageAtService ?? maintenance.mileageAtService;

    if (dto.mileageAtService !== undefined && dto.mileageAtService < vehicle.mileage) {
      throw new CustomBadRequestException(
        'Mileage below vehicle current mileage',
        VEHICLE_ERRORS.MILEAGE_BELOW_VEHICLE,
      );
    }

    const removedUrls = maintenance.imageUrls.filter(
      (url) => !(dto.imageUrls ?? []).includes(url),
    );
    await this.deleteGcpImages(removedUrls);

    const uploadedUrls = await Promise.all(
      files.map((file) =>
        this.storageService.upload(
          file.buffer,
          this.buildMaintenanceFilename(vehicle.patent, dto.performedAt ?? maintenance.performedAt, file.mimetype),
          file.mimetype,
          envs.gcp.publicBucketName,
        ),
      ),
    );

    const imageUrls = [...(dto.imageUrls ?? []), ...uploadedUrls];

    await this.prisma.vehicleMaintenance.update({
      where: { id: maintenanceId },
      data: {
        ...(dto.performedAt !== undefined && { performedAt: new Date(dto.performedAt) }),
        ...(dto.mileageAtService !== undefined && {
          mileageAtService: dto.mileageAtService,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
        imageUrls,
      },
    });

    this.logger.log(`Maintenance ${maintenanceId} updated with ${imageUrls.length} images`);
    return this.findById(vehicleId);
  }

  async deleteMaintenance(vehicleId: string, maintenanceId: string) {
    const maintenance = await this.prisma.vehicleMaintenance.findFirst({
      where: { id: maintenanceId, vehicleId },
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record ${maintenanceId} not found`);
    }

    await this.deleteGcpImages(maintenance.imageUrls);
    await this.prisma.vehicleMaintenance.delete({ where: { id: maintenanceId } });

    this.logger.log(`Maintenance deleted: ${maintenanceId}`);
    return this.findById(vehicleId);
  }

  // ─── private helpers ──────────────────────────────────────────────────────

  private async deleteGcpImages(urls: string[]): Promise<void> {
    if (!urls.length) return;
    const baseUrl = `https://storage.googleapis.com/${envs.gcp.publicBucketName}/`;
    await Promise.all(
      urls.map((url) =>
        this.storageService.delete(url.replace(baseUrl, ''), envs.gcp.publicBucketName),
      ),
    );
  }

  private buildMaintenanceFilename(patent: string, performedAt: string | Date, mimetype: string): string {
    const ext = mimetype.split('/')[1] ?? 'jpg';
    const date = new Date(performedAt).toISOString().slice(0, 10);
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return `vehicles/${patent}/maintenances/${date}/${unique}.${ext}`;
  }

  private buildVehicleImageFilename(patent: string, mimetype: string): string {
    const ext = mimetype.split('/')[1] ?? 'jpg';
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return `vehicles/${patent}/images/${unique}.${ext}`;
  }
}
