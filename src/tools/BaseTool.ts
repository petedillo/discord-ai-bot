// Base class for all tools
import type { ITool, ToolSchema, ToolResult } from '../ai/types.js';

/**
 * Abstract base class that all tools should extend.
 *
 * @example
 * ```typescript
 * interface MyToolArgs {
 *   query: string;
 *   limit?: number;
 * }
 *
 * class MyTool extends BaseTool<MyToolArgs> {
 *   readonly name = 'my_tool';
 *   readonly schema = { ... };
 *   async execute(args: MyToolArgs): Promise<ToolResult> { ... }
 * }
 * ```
 */
export abstract class BaseTool<TArgs = Record<string, unknown>>
  implements ITool<TArgs>
{
  abstract readonly name: string;
  abstract readonly schema: ToolSchema;
  abstract execute(args: TArgs): Promise<ToolResult>;
}

export default BaseTool;
