import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

@Controller('permissions/roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() data: CreateRoleDto) {
    this.logger.debug('Received request to create role');
    return this.rolesService.create(data);
  }

  @Get()
  findAll() {
    this.logger.debug('Received request to list roles');
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.debug(`Received request to get role ${id}`);
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    this.logger.debug(`Received request to update role ${id}`);
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.logger.debug(`Received request to delete role ${id}`);
    return this.rolesService.delete(id);
  }
}
