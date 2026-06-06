import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGO_URI: string;
  API_VERSION: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env: EnvConfig = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as EnvConfig['NODE_ENV'],
  PORT: parseInt(optionalEnv('PORT', '3001'), 10),
  MONGO_URI: requireEnv('MONGO_URI'),
  API_VERSION: optionalEnv('API_VERSION', 'v1'),
  RATE_LIMIT_WINDOW_MS: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
};
