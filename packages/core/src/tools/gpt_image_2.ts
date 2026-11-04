import type { GptImage2Schema } from "../types.js";
import { gptImageTool } from "./gpt_image.js";
import type { ToolDef } from "./types.js";

/**
 * Fork compatibility (oliverhees): upstream renamed `gpt_image_2` to
 * `gpt_image` in 5.3.0. Existing skills and prompts still call the old name,
 * so it stays available as an alias with the same parameters and behavior.
 */
export const gptImage2AliasTool: ToolDef<typeof GptImage2Schema> = {
  ...gptImageTool,
  name: "gpt_image_2",
  description:
    "Alias of `gpt_image` (old name, kept for existing workflows). Generate and edit images using GPT Image 2.5 Flare or Sunburst with up to 16 references, 1K/2K/4K output, and background control. Prefer `gpt_image` for new work.",
};
