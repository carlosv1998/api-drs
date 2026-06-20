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
import { PermissionsService } from './permissions.service';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { ValidateScopesDto } from './dtos/validate-scopes.dto';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { CreateOrUpdatePermissionsDto } from './dtos/create-or-update-permissions.dto';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

@Controller('permissions')
export class PermissionsController {
  private readonly logger = new Logger(PermissionsController.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  @RequirePermissions([SCOPE_NAME.PERMISSIONS_UPDATE])
  @Patch()
  patch(
    @Body() data: CreateOrUpdatePermissionsDto,
    @GetUser('id') assignedById: string,
  ) {
    this.logger.debug('Received request to upsert permissions');
    return this.permissionsService.createOrUpdate(data, assignedById);
  }

  @Get('me')
  getMyPermissions(@GetUser('id') userId: string) {
    this.logger.debug('Received request to get own permissions');
    return this.permissionsService.findExpandedByUserId(userId);
  }

  @Get('me/scopes')
  getMyEffectiveScopes(@GetUser('id') userId: string) {
    this.logger.debug('Received request to get effective scopes');
    return this.permissionsService.getEffectiveScopes(userId);
  }

  @Post('validate')
  async validate(
    @GetUser('id') userId: string,
    @Body() { scopes }: ValidateScopesDto,
  ) {
    this.logger.debug(`Received request to validate scopes for user ${userId}`);
    const allowed = await this.permissionsService.hasAnyScope(userId, scopes);
    return { allowed };
  }

  @RequirePermissions([SCOPE_NAME.PERMISSIONS_CREATE])
  @Get('user/:userId')
  findUserWithPermissions(@Param('userId') userId: string) {
    this.logger.debug(`Received request to get profile + permissions for user ${userId}`);
    return this.permissionsService.findUserWithPermissions(userId);
  }

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    this.logger.debug(`Received request to get permissions for user ${userId}`);
    return this.permissionsService.findExpandedByUserId(userId);
  }

  @Patch(':userId')
  update(
    @Param('userId') userId: string,
    @Body() data: UpdatePermissionDto,
  ) {
    this.logger.debug(`Received request to update permissions for user ${userId}`);
    return this.permissionsService.update(userId, data);
  }

  @Delete(':userId')
  delete(@Param('userId') userId: string) {
    this.logger.debug(`Received request to delete permissions for user ${userId}`);
    return this.permissionsService.delete(userId);
  }
}
