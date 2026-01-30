// Command definitions barrel export
export { askCommand } from './ask.js';
export { infoCommand } from './info.js';
export { toolsCommand } from './tools.js';

import { askCommand } from './ask.js';
import { infoCommand } from './info.js';
import { toolsCommand } from './tools.js';

export const allCommands = [askCommand, infoCommand, toolsCommand];
