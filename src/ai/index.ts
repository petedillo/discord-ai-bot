// AI module exports
export { OllamaClient } from './OllamaClient.js';
export type { OllamaClientConfig } from './OllamaClient.js';

export { ToolRegistry, registry } from './ToolRegistry.js';
export { ToolExecutor } from './ToolExecutor.js';

export type {
  ITool,
  ToolSchema,
  ToolParameters,
  ToolParameterProperty,
  ToolResult,
  ToolSuccessResult,
  ToolErrorResult,
  ToolExecutionRecord,
  ProcessMessageResult,
  OllamaToolDefinition,
  ToolDescription,
  OnToolCallCallback,
} from './types.js';
