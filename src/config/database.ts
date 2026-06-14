import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown'}`);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
