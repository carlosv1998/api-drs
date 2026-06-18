import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dtos/register-push-token.dto';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dtos/filter.dto';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@GetUser('id') userId: string, @Query() paginationDto: PaginationDto) {
    return this.notificationsService.findAll(userId, paginationDto);
  }

  @Get('unread-count')
  unreadCount(@GetUser('id') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Patch('read-all')
  markAllAsRead(@GetUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  markAsRead(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('push-token')
  registerPushToken(
    @GetUser('id') userId: string,
    @Body() { token }: RegisterPushTokenDto,
  ) {
    this.logger.log(`Registering push token for user ${userId}`);
    return this.notificationsService.registerPushToken(userId, token);
  }

  @Delete('push-token')
  removePushToken(@Body() { token }: RegisterPushTokenDto) {
    return this.notificationsService.removePushToken(token);
  }
}
