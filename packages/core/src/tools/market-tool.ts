import type { z } from "zod";
import type { TaskRecord } from "../types.js";
import type { ToolContext, ToolDef, ToolResult } from "./types.js";

/** One Market API job: the model id, its input, and a summary for the reply. */
export interface MarketJob {
  model: string;
  input: Record<string, unknown>;
  label: string;
  parameters?: Record<string, unknown>;
}

/**
 * Fork helper for tools that map a validated request onto one Kie.ai Market
 * job (POST /jobs/createTask). Keeps every fork tool on the same task-record
 * and reply format as the upstream tools.
 */
export function marketTool<S extends z.ZodTypeAny>(options: {
  name: string;
  description: string;
  category: ToolDef["category"];
  schema: S;
  apiType: TaskRecord["api_type"];
  build: (request: z.infer<S>) => MarketJob;
  hints: Record<string, string>;
}): ToolDef<S> {
  return {
    name: options.name,
    description: options.description,
    category: options.category,
    schema: options.schema,
    async run(args, ctx: ToolContext): Promise<ToolResult> {
      try {
        const request = options.schema.parse(args) as z.infer<S> & {
          callBackUrl?: string;
        };
        const job = options.build(request);
        const response = await ctx.client.createMarketTask(
          job.model,
          job.input,
          ctx.getCallbackUrl(request.callBackUrl),
        );
        if (response.code !== 200 || !response.data?.taskId) {
          throw new Error(response.msg || `Failed to create ${job.label} task`);
        }
        await ctx.db.createTask({
          task_id: response.data.taskId,
          api_type: options.apiType,
          status: "pending",
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  task_id: response.data.taskId,
                  message: `${job.label} task created successfully`,
                  parameters: { model: job.model, ...job.parameters },
                  next_steps: [
                    `Use get_task_status or wait_for_task with task_id: ${response.data.taskId}`,
                  ],
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return ctx.formatError(options.name, error, options.hints);
      }
    },
  };
}

/** Copies only the keys that are set, so Kie.ai applies its own defaults. */
export function pick(
  source: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && !(Array.isArray(value) && value.length === 0))
      out[key] = value;
  }
  return out;
}
