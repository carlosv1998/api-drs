import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaginatedQueryDto } from 'src/common/dtos/filter.dto';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleDto } from './dtos/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';
import { RequirePermissions } from 'src/permissions/decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

@Controller('vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(private readonly vehiclesService: VehiclesService) {}

  @RequirePermissions([SCOPE_NAME.VEHICLES_READ])
  @Get()
  findAll(@Query() query: PaginatedQueryDto) {
    this.logger.debug('Received request to find all vehicles');
    const { page, pageSize, filterDto } = query;
    return this.vehiclesService.findAll({ page, pageSize }, filterDto);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_READ])
  @Get(':id')
  findById(@Param('id') id: string) {
    this.logger.debug(`Received request to find vehicle ${id}`);
    return this.vehiclesService.findById(id);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_CREATE])
  @Post()
  create(@Body() dto: CreateVehicleDto) {
    this.logger.debug('Received request to create vehicle');
    return this.vehiclesService.create(dto);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_UPDATE])
  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    this.logger.debug(`Received request to update vehicle ${id}`);
    return this.vehiclesService.update(id, userId, dto);
  }

  @RequirePermissions([SCOPE_NAME.VEHICLES_DELETE])
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.debug(`Received request to delete vehicle ${id}`);
    return this.vehiclesService.remove(id);
  }
}
