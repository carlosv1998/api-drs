import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterDto, PaginationDto } from 'src/common/dtos/filter.dto';
import { PrismaHelper } from 'src/common/helpers/prisma.helper';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { CustomBadRequestException } from 'src/common/exceptions/custom-exceptions';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import {
  AddMaintenanceData,
  BaseVehicleUpdateData,
  DeleteMaintenanceData,
  UpdateMaintenanceData,
  UpdateVehicleDto,
} from './dtos/update-vehicle.dto';
import { VEHICLE_UPDATE_ACTION } from './enums';
import { VEHICLE_ERRORS } from './errors';

const VEHICLE_INCLUDE = {
  maintenances: {
    orderBy: { performedAt: 'desc' as const },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  },
};

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }

    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { patent: dto.patent },
    });

    if (existing) {
      throw new CustomBadRequestException(
        'Patent already in use',
        VEHICLE_ERRORS.PATENT_ALREADY_IN_USE,
      );
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        patent: dto.patent,
        type: dto.type,
        mileage: dto.mileage ?? 0,
        nextMaintenance: dto.nextMaintenance ? new Date(dto.nextMaintenance) : null,
        maintainMileageInterval: dto.maintainMileageInterval ?? null,
      },
      include: VEHICLE_INCLUDE,
    });

    this.logger.log(`Vehicle created: ${vehicle.id}`);
    return vehicle;
  }

  async update(id: string, userId: string, dto: UpdateVehicleDto) {
    switch (dto.action) {
      case VEHICLE_UPDATE_ACTION.BASE_UPDATE:
        return this.handleBaseUpdate(id, userId, dto);
      case VEHICLE_UPDATE_ACTION.ADD_MAINTENANCE:
        return this.handleAddMaintenance(id, userId, dto);
      case VEHICLE_UPDATE_ACTION.UPDATE_MAINTENANCE:
        return this.handleUpdateMaintenance(id, dto);
      case VEHICLE_UPDATE_ACTION.DELETE_MAINTENANCE:
        return this.handleDeleteMaintenance(id, dto);
    }
  }

  async remove(id: string) {
    await this.findById(id);
    const vehicle = await this.prisma.vehicle.delete({ where: { id } });
    this.logger.log(`Vehicle deleted: ${id}`);
    return vehicle;
  }

  // ─── private action handlers ──────────────────────────────────────────────

  private async handleBaseUpdate(id: string, userId: string, dto: UpdateVehicleDto) {
    const data = dto.data as BaseVehicleUpdateData;
    await this.findById(id);

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.mileage !== undefined && { mileage: data.mileage }),
        ...(data.nextMaintenance !== undefined && {
          nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance) : null,
        }),
        ...(data.maintainMileageInterval !== undefined && {
          maintainMileageInterval: data.maintainMileageInterval,
        }),
        updatedById: userId,
        lastUpdate: new Date(),
      },
      include: VEHICLE_INCLUDE,
    });

    this.logger.log(`Vehicle base-update: ${id}`);
    return vehicle;
  }

  private async handleAddMaintenance(id: string, userId: string, dto: UpdateVehicleDto) {
    const data = dto.data as AddMaintenanceData;
    const vehicle = await this.findById(id);

    await this.prisma.vehicleMaintenance.create({
      data: {
        vehicleId: id,
        performedAt: new Date(data.performedAt),
        mileageAtService: data.mileageAtService,
        nextMaintenanceMileage: vehicle.maintainMileageInterval
          ? data.mileageAtService + vehicle.maintainMileageInterval
          : null,
        notes: data.notes ?? null,
        createdById: userId,
      },
    });

    this.logger.log(`Maintenance added to vehicle: ${id}`);
    return this.findById(id);
  }

  private async handleUpdateMaintenance(id: string, dto: UpdateVehicleDto) {
    const data = dto.data as UpdateMaintenanceData;

    const maintenance = await this.prisma.vehicleMaintenance.findFirst({
      where: { id: data.maintenanceId, vehicleId: id },
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record ${data.maintenanceId} not found`);
    }

    const vehicle = await this.findById(id);
    const newMileageAtService = data.mileageAtService ?? maintenance.mileageAtService;

    await this.prisma.vehicleMaintenance.update({
      where: { id: data.maintenanceId },
      data: {
        ...(data.performedAt !== undefined && { performedAt: new Date(data.performedAt) }),
        ...(data.mileageAtService !== undefined && {
          mileageAtService: data.mileageAtService,
          nextMaintenanceMileage: vehicle.maintainMileageInterval
            ? newMileageAtService + vehicle.maintainMileageInterval
            : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    this.logger.log(`Maintenance updated: ${data.maintenanceId}`);
    return this.findById(id);
  }

  private async handleDeleteMaintenance(id: string, dto: UpdateVehicleDto) {
    const data = dto.data as DeleteMaintenanceData;

    const maintenance = await this.prisma.vehicleMaintenance.findFirst({
      where: { id: data.maintenanceId, vehicleId: id },
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record ${data.maintenanceId} not found`);
    }

    await this.prisma.vehicleMaintenance.delete({ where: { id: data.maintenanceId } });

    this.logger.log(`Maintenance deleted: ${data.maintenanceId}`);
    return this.findById(id);
  }
}
