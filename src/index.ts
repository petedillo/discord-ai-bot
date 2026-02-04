// Entry point
import { start } from './main.js';
import { logger } from './utils/index.js';

start().catch((error) => {
  logger.error('Failed to start bot:', error);
  process.exit(1);
});
