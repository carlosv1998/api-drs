import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EMAIL_TYPE } from 'src/common/enums/email-type.enum';

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsEnum(EMAIL_TYPE)
  @IsNotEmpty()
  type: EMAIL_TYPE;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  data?: Record<string, any>;
}

export interface EmailVerificationData {
  firstName: string;
  verificationUrl: string;
}

export interface PasswordResetData {
  firstName: string;
  resetUrl: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  firstName: string;
  loginUrl: string;
}

export interface NotificationEmailData {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}
