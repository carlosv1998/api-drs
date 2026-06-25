import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PaginatedQueryDto } from 'src/common/dtos/filter.dto';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleBaseBodyDto } from './dtos/update-vehicle-base-body.dto';
import { AddMaintenanceBodyDto } from './dtos/add-maintenance-body.dto';
import { UpdateMaintenanceBodyDto } from './dtos/update-maintenance-body.dto';
import { VehiclesService } from './vehicles.service';
import { RequirePermissions } from 'src/permissions/decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

const FILE_PIPE = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
  ],
  fileIsRequired: false,
});

@Controller('vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(private readonly vehiclesService: VehiclesService) {}

  @RequirePermissions([SCOPE_NAME.VEHICLES_READ])
  @Get()
  findAll(@Query() query: PaginatedQueryDto) {
    const { page, pageSize, filterDto } = query;
    return this.vehiclesService.findAll({ page, pageSize }, filterDto);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_READ])
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_CREATE])
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Body() dto: CreateVehicleDto,
    @UploadedFiles(FILE_PIPE) images: Express.Multer.File[],
  ) {
    return this.vehiclesService.create(dto, images ?? []);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_UPDATE])
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateVehicleBaseBodyDto,
    @UploadedFiles(FILE_PIPE) images: Express.Multer.File[],
  ) {
    return this.vehiclesService.updateBase(id, userId, dto, images ?? []);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_DELETE])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_UPDATE])
  @Post(':id/maintenances')
  @UseInterceptors(FilesInterceptor('images', 5))
  addMaintenance(
    @Param('id') vehicleId: string,
    @GetUser('id') userId: string,
    @Body() dto: AddMaintenanceBodyDto,
    @UploadedFiles(FILE_PIPE) images: Express.Multer.File[],
  ) {
    return this.vehiclesService.addMaintenance(vehicleId, userId, dto, images ?? []);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_UPDATE])
  @Patch(':id/maintenances/:maintenanceId')
  @UseInterceptors(FilesInterceptor('images', 5))
  updateMaintenance(
    @Param('id') vehicleId: string,
    @Param('maintenanceId') maintenanceId: string,
    @Body() dto: UpdateMaintenanceBodyDto,
    @UploadedFiles(FILE_PIPE) images: Express.Multer.File[],
  ) {
    return this.vehiclesService.updateMaintenanceFull(vehicleId, maintenanceId, dto, images ?? []);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_UPDATE])
  @Delete(':id/maintenances/:maintenanceId')
  deleteMaintenance(
    @Param('id') vehicleId: string,
    @Param('maintenanceId') maintenanceId: string,
  ) {
    return this.vehiclesService.deleteMaintenance(vehicleId, maintenanceId);
  }
}
