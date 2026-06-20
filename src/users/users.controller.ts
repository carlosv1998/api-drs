import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginatedQueryDto } from 'src/common/dtos/filter.dto';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: PaginatedQueryDto) {
    this.logger.debug('Received request to find all users');
    const { page, pageSize, filterDto } = query;
    return this.usersService.findAll({ page, pageSize }, filterDto);
  }

  @Get('options')
  findOptions(@Query('jobTitles') rawJobTitles?: string | string[]) {
    const jobTitles = rawJobTitles
      ? (Array.isArray(rawJobTitles) ? rawJobTitles : [rawJobTitles])
      : undefined;
    return this.usersService.findOptions(jobTitles);
  }

  @Patch('me')
  updateMe(@GetUser('id') userId: string, @Body() data: UpdateUserDto) {
    this.logger.debug(`Received request to update profile for user ${userId}`);
    return this.usersService.update(userId, data);
  }

  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @GetUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.debug(`Received request to upload avatar for user ${userId}`);
    return this.usersService.uploadAvatar(userId, file);
  }

  @Delete('me/avatar')
  deleteAvatar(@GetUser('id') userId: string) {
    this.logger.debug(`Received request to delete avatar for user ${userId}`);
    return this.usersService.deleteAvatar(userId);
  }

  @Patch('me/signature')
  @UseInterceptors(FileInterceptor('file'))
  uploadSignature(
    @GetUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(png|jpeg|svg)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.debug(`Received request to upload signature for user ${userId}`);
    return this.usersService.uploadSignature(userId, file);
  }

  @Delete('me/signature')
  deleteSignature(@GetUser('id') userId: string) {
    this.logger.debug(`Received request to delete signature for user ${userId}`);
    return this.usersService.deleteSignature(userId);
  }
}
