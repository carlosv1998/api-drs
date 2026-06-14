import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  getEmailVerificationTemplate,
  getPasswordResetTemplate,
  getWelcomeEmailTemplate,
  getNotificationEmailTemplate,
} from './templates';
import { envs } from 'src/config/envs';
import {
  EmailVerificationData,
  NotificationEmailData,
  PasswordResetData,
  SendEmailDto,
  WelcomeEmailData,
} from './dtos/send-email.dto';
import {
  CustomBadRequestException,
  CustomInternalServerErrorException,
} from 'src/common/exceptions/custom-exceptions';
import { EMAIL_ERRORS } from './errors';
import { EMAIL_TYPE } from 'src/common/enums/email-type.enum';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger('EmailService');

  private readonly resend: Resend;
  private readonly fromEmail = envs.email.domainEmail;

  constructor() {
    this.resend = new Resend(envs.email.serviceApiKey);
  }

  async sendEmail(
    data: SendEmailDto,
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const html = this.getEmailTemplate(data.type, data.data);

      this.logger.log(`Sending ${data.type} email to ${data.to}`);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: data.subject,
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send email to ${data.to}`, {
          error: result.error,
        });
        throw new CustomInternalServerErrorException(
          `Failed to send email: ${result.error.message}`,
          EMAIL_ERRORS.SEND_FAILED,
        );
      }

      this.logger.log(`Email sent successfully to ${data.to}`, {
        messageId: result.data?.id,
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      this.logger.error(
        `Error sending email to ${data.to}, error: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  private getEmailTemplate(
    type: EMAIL_TYPE,
    data?: Record<string, any>,
  ): string {
    switch (type) {
      case EMAIL_TYPE.EMAIL_VERIFICATION:
        return getEmailVerificationTemplate(data as EmailVerificationData);

      case EMAIL_TYPE.PASSWORD_RESET:
        return getPasswordResetTemplate(data as PasswordResetData);

      case EMAIL_TYPE.WELCOME:
        return getWelcomeEmailTemplate(data as WelcomeEmailData);

      case EMAIL_TYPE.NOTIFICATION:
        return getNotificationEmailTemplate(data as NotificationEmailData);

      default:
        throw new CustomBadRequestException(
          `Invalid email type: ${type}`,
          EMAIL_ERRORS.INVALID_TEMPLATE,
        );
    }
  }
}
