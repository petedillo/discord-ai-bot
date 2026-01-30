// Math Tool - performs mathematical calculations
import { BaseTool } from './BaseTool.js';
import type { ToolSchema, ToolResult } from '../ai/types.js';

interface MathToolArgs {
  expression: string;
}

class MathTool extends BaseTool<MathToolArgs> {
  readonly name = 'calculate';

  readonly schema: ToolSchema = {
    name: 'calculate',
    description:
      'Perform a mathematical calculation. Supports basic arithmetic (+, -, *, /, %) and common math functions (sqrt, pow, sin, cos, tan, log, abs, ceil, floor, round).',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description:
            'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "pow(2, 8)", "sin(3.14159)")',
        },
      },
      required: ['expression'],
    },
  };

  private readonly mathContext: Record<string, unknown> = {
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    random: Math.random,
    round: Math.round,
    sign: Math.sign,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan,
    trunc: Math.trunc,
    PI: Math.PI,
    E: Math.E,
  };

  async execute(args: MathToolArgs): Promise<ToolResult> {
    const { expression } = args;

    try {
      // Sanitize expression - only allow safe characters
      const sanitized = expression.replace(/[^0-9+\-*/().,%\s\w]/g, '');

      // Create safe evaluation context
      const keys = Object.keys(this.mathContext);
      const values = Object.values(this.mathContext);

      const safeEval = new Function(...keys, `return ${sanitized}`);
      const result = safeEval(...values) as unknown;

      if (typeof result !== 'number' || !Number.isFinite(result)) {
        return {
          success: false,
          error: 'Result is not a valid number',
        };
      }

      return {
        success: true,
        expression,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new MathTool();
