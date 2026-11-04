import { z } from "zod";
import { NanoBananaImageSchema } from "../types.js";
import type { ToolContext, ToolDef, ToolResult } from "./types.js";

const NANO_BANANA_LABELS: Record<string, string> = {
  "nano-banana-2": "Nano Banana 2",
  "nano-banana-2-lite": "Nano Banana 2 Lite",
  "nano-banana-pro": "Nano Banana Pro",
  "nano-banana-2-1": "Nano Banana 2.1",
};

export const nanoBananaImageTool: ToolDef<typeof NanoBananaImageSchema> = {
  name: "nano_banana_image",
  description:
    "Generate and edit images using Nano Banana 2, the faster 1K Nano Banana 2 Lite, Nano Banana Pro or Nano Banana 2.1. Nano Banana 2 supports 4K, 14 references, and Google Search grounding; Lite supports up to 10 references; Pro up to 8 and 2.1 up to 10 references at up to 4K.",
  category: "image",
  schema: NanoBananaImageSchema,
  async run(args, ctx: ToolContext): Promise<ToolResult> {
    try {
      const request = NanoBananaImageSchema.parse(args);

      const response = await ctx.client.generateNanoBananaImage(request);

      // Determine mode and api_type based on parameters
      const isEdit = !!request.image_input && request.image_input.length > 0;
      const apiType = isEdit ? "nano-banana-edit" : "nano-banana-image";
      const modeDescription = isEdit ? "edit" : "generate";

      if (response.code === 200 && response.data?.taskId) {
        await ctx.db.createTask({
          task_id: response.data.taskId,
          api_type: apiType as any,
          status: "pending",
          result_url: response.data.imageUrl,
        });
      } else {
        throw new Error(
          response.msg || "Failed to create Nano Banana image task",
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                response: response,
                mode: modeDescription,
                message: `${NANO_BANANA_LABELS[request.model ?? "nano-banana-2"]} image ${modeDescription} initiated`,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return ctx.formatError("nano_banana_image", error, {
        prompt:
          "Required for generate/edit modes: text description (max 5000 chars)",
        model:
          'Optional: "nano-banana-2" (default), "nano-banana-2-lite", "nano-banana-pro" or "nano-banana-2-1"',
        image_input:
          "Optional for edit mode: array of up to 14 reference image URLs",
        output_format: 'Optional: "png" or "jpg"',
        aspect_ratio: 'Optional: aspect ratio like "16:9", "1:1", etc.',
        resolution: 'Optional: "1K", "2K", or "4K"',
        google_search:
          "Optional: enable Google Search grounding (default: false)",
      });
    }
  },
};
