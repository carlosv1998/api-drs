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
import { ScopesService } from './scopes.service';
import { CreateScopeDto } from './dtos/create-scope.dto';
import { UpdateScopeDto } from './dtos/update-scope.dto';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

@Controller('permissions/scopes')
export class ScopesController {
  private readonly logger = new Logger(ScopesController.name);

  constructor(private readonly scopesService: ScopesService) {}

  @RequirePermissions([SCOPE_NAME.SCOPES_CREATE])
  @Post()
  create(@Body() data: CreateScopeDto) {
    this.logger.debug('Received request to create scope');
    return this.scopesService.create(data);
  }

  @RequirePermissions([SCOPE_NAME.SCOPES_READ])
  @Get()
  findAll() {
    this.logger.debug('Received request to list scopes');
    return this.scopesService.findAll();
  }

  @RequirePermissions([SCOPE_NAME.SCOPES_READ])
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.debug(`Received request to get scope ${id}`);
    return this.scopesService.findById(id);
  }

  @RequirePermissions([SCOPE_NAME.SCOPES_UPDATE])
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateScopeDto) {
    this.logger.debug(`Received request to update scope ${id}`);
    return this.scopesService.update(id, data);
  }

  @RequirePermissions([SCOPE_NAME.SCOPES_DELETE])
  @Delete(':id')
  delete(@Param('id') id: string) {
    this.logger.debug(`Received request to delete scope ${id}`);
    return this.scopesService.delete(id);
  }
}
