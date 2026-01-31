// AI module type definitions

import type { ChatResponse, Message } from 'ollama';

/**
 * JSON Schema parameter property
 */
export interface ToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
  required?: string[];
}

/**
 * JSON Schema for tool parameters
 */
export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required: string[];
}

/**
 * Tool schema definition for Ollama API
 */
export interface ToolSchema {
  name: string;
  description: string;
  parameters: ToolParameters;
}

/**
 * Tool definition format for Ollama API
 */
export interface OllamaToolDefinition {
  type: 'function';
  function: ToolSchema;
}

/**
 * Successful tool execution result
 */
export interface ToolSuccessResult {
  success: true;
  [key: string]: unknown;
}

/**
 * Failed tool execution result
 */
export interface ToolErrorResult {
  success: false;
  error: string;
}

/**
 * Tool execution result
 */
export type ToolResult = ToolSuccessResult | ToolErrorResult;

/**
 * Interface that all tools must implement
 */
export interface ITool<TArgs = Record<string, unknown>> {
  readonly name: string;
  readonly schema: ToolSchema;
  execute(args: TArgs): Promise<ToolResult>;
}

/**
 * Tool call from Ollama response
 */
export interface ToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

/**
 * Record of a tool execution
 */
export interface ToolExecutionRecord {
  name: string;
  args: Record<string, unknown>;
  result: ToolResult;
  durationMs?: number;
}

/**
 * Result of processing a message with tools
 */
export interface ProcessMessageResult {
  response: string;
  toolsUsed: ToolExecutionRecord[];
}

/**
 * Tool description for display
 */
export interface ToolDescription {
  name: string;
  description: string;
  parameters: ToolParameters;
}

/**
 * Callback for tool execution events
 */
export type OnToolCallCallback = (toolName: string, args: Record<string, unknown>) => void;

// Re-export ollama types
export type { ChatResponse, Message };
