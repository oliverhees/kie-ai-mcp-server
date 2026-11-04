import { PixverseVideoSchema } from "../types.js";
import { marketTool } from "./market-tool.js";

export const pixverseVideoTool = marketTool({
  name: "pixverse_video",
  description:
    "Generate videos with PixVerse V6 Max: text-to-video or image-to-video (one start image), 1-15s, 360p-1080p, optional native audio.",
  category: "video",
  schema: PixverseVideoSchema,
  apiType: "pixverse-video",
  build(r) {
    const mode = r.image_url ? "image-to-video" : "text-to-video";
    const input: Record<string, unknown> = {
      prompt: r.prompt,
      quality: r.quality ?? "720p",
      duration: r.duration ?? 5,
      generate_audio_switch: r.generate_audio ?? false,
    };
    if (r.image_url) input.image_urls = [r.image_url];
    else input.aspect_ratio = r.aspect_ratio ?? "16:9";
    if (r.seed !== undefined) input.seed = r.seed;
    return {
      model: `pixverse-v6-max/${mode}`,
      input,
      label: `PixVerse V6 Max ${mode}`,
      parameters: { mode, quality: input.quality, duration: input.duration },
    };
  },
  hints: {
    prompt: "Required: prompt (max 5000 chars)",
    image_url: "Optional: start image URL for image-to-video",
    duration: "Optional: 1-15 seconds (default 5)",
  },
});
