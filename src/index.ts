// Entry point
import { start } from './main.js';

start().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
