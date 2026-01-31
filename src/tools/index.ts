// Auto-load all tools and export registry
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry } from '../ai/ToolRegistry.js';
import type { ITool } from '../ai/types.js';

// Re-export for convenience
export { BaseTool } from './BaseTool.js';
export { registry };

const __dirname = dirname(fileURLToPath(import.meta.url));

// Find and load all *.tool.js files (compiled from *.tool.ts)
const toolFiles = readdirSync(__dirname).filter((file) => file.endsWith('.tool.js'));

for (const file of toolFiles) {
  try {
    const toolModule = (await import(join(__dirname, file))) as { default: ITool };
    const tool = toolModule.default;

    if (tool?.name && tool?.schema && typeof tool.execute === 'function') {
      registry.register(tool);
    } else {
      console.warn(`Skipping invalid tool file: ${file}`);
    }
  } catch (error) {
    console.error(`Failed to load tool from ${file}:`, error);
  }
}

console.log(`Loaded ${toolFiles.length} tools: ${registry.getToolNames().join(', ')}`);
