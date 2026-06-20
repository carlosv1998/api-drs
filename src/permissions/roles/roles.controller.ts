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
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

@Controller('permissions/roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions([SCOPE_NAME.ROLES_CREATE])
  @Post()
  create(@Body() data: CreateRoleDto) {
    this.logger.debug('Received request to create role');
    return this.rolesService.create(data);
  }

  @RequirePermissions([SCOPE_NAME.ROLES_READ])
  @Get()
  findAll() {
    this.logger.debug('Received request to list roles');
    return this.rolesService.findAll();
  }

  @Get('public')
  findPublic() {
    this.logger.debug('Received request to list public roles');
    return this.rolesService.findPublic();
  }

  @RequirePermissions([SCOPE_NAME.ROLES_READ])
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.debug(`Received request to get role ${id}`);
    return this.rolesService.findById(id);
  }

  @RequirePermissions([SCOPE_NAME.ROLES_UPDATE])
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    this.logger.debug(`Received request to update role ${id}`);
    return this.rolesService.update(id, data);
  }

  @RequirePermissions([SCOPE_NAME.ROLES_DELETE])
  @Delete(':id')
  delete(@Param('id') id: string) {
    this.logger.debug(`Received request to delete role ${id}`);
    return this.rolesService.delete(id);
  }
}
