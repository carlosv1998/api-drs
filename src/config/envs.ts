import 'dotenv/config';
import * as joi from 'joi';
import { ENVIRONMENT } from 'src/common/enums/environment.enum';

interface EnvVars {
  PORT: number;
  ENVIRONMENT: ENVIRONMENT;
  DATABASE_URL: string;
  RESEND_API_KEY: string;
  RESEND_DOMAIN_EMAIL: string;
  ACCESS_TOKEN_KEY: string;
  ACCESS_TOKEN_EXPIRATION: number;
  REFRESH_TOKEN_KEY: string;
  REFRESH_TOKEN_EXPIRATION: number;
  MAX_SESSIONS_PER_USER: number;
  WEB_CLIENT_URL: string;
  GCP_PROJECT_ID: string;
  GCP_CLIENT_EMAIL: string;
  GCP_PRIVATE_KEY: string;
  GCP_BUCKET_NAME: string;
  GCP_PUBLIC_BUCKET_NAME: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    ENVIRONMENT: joi
      .string()
      .valid(...Object.values(ENVIRONMENT))
      .required(),
    DATABASE_URL: joi.string().required(),
    RESEND_API_KEY: joi.string().required(),
    RESEND_DOMAIN_EMAIL: joi.string().required(),
    ACCESS_TOKEN_KEY: joi.string().required(),
    ACCESS_TOKEN_EXPIRATION: joi.number().required(),
    REFRESH_TOKEN_KEY: joi.string().required(),
    REFRESH_TOKEN_EXPIRATION: joi.number().required(),
    MAX_SESSIONS_PER_USER: joi.number().required(),
    WEB_CLIENT_URL: joi.string().required(),
    GCP_PROJECT_ID: joi.string().required(),
    GCP_CLIENT_EMAIL: joi.string().required(),
    GCP_PRIVATE_KEY: joi.string().required(),
    GCP_BUCKET_NAME: joi.string().required(),
    GCP_PUBLIC_BUCKET_NAME: joi.string().required(),
  })
  .unknown(true);

const { value, error }: { value: EnvVars; error?: joi.ValidationError } =
  envsSchema.validate(process.env);

if (error) {
  console.error('Config validation error:', error.message);
  console.error('Details:', error.details);
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  environment: envVars.ENVIRONMENT,
  databaseUrl: envVars.DATABASE_URL,
  email: {
    serviceApiKey: envVars.RESEND_API_KEY,
    domainEmail: envVars.RESEND_DOMAIN_EMAIL,
  },
  tokens: {
    accessTokenKey: envVars.ACCESS_TOKEN_KEY,
    accessTokenExpiration: envVars.ACCESS_TOKEN_EXPIRATION,
    refreshTokenKey: envVars.REFRESH_TOKEN_KEY,
    refreshTokenExpiration: envVars.REFRESH_TOKEN_EXPIRATION,
  },
  auth: {
    maxSessionsPerUser: envVars.MAX_SESSIONS_PER_USER,
  },
  web: {
    clientUrl: envVars.WEB_CLIENT_URL,
  },
  gcp: {
    projectId: envVars.GCP_PROJECT_ID,
    clientEmail: envVars.GCP_CLIENT_EMAIL,
    privateKey: envVars.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    bucketName: envVars.GCP_BUCKET_NAME,
    publicBucketName: envVars.GCP_PUBLIC_BUCKET_NAME,
  },
};
