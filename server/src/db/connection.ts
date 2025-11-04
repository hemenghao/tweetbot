import mongoose from 'mongoose';
import { config } from '../config.js';
import logger from '../utils/logger.js';

export const connectToDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${(error as Error).message}`);
    throw error;
  }
};

export default mongoose;
