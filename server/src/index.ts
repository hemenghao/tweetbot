import { startServer } from './server.js';
import logger from './utils/logger.js';

startServer().catch((error) => {
  logger.error(`Server failed to start: ${(error as Error).message}`);
  process.exit(1);
});
