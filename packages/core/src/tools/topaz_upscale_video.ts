import { TopazUpscaleVideoSchema } from "../types.js";
import { marketTool } from "./market-tool.js";

export const topazUpscaleVideoTool = marketTool({
  name: "topaz_upscale_video",
  description:
    "Upscale and enhance a video with Topaz (1x, 2x or 4x). Input MP4, MOV or MKV up to 50MB.",
  category: "video",
  schema: TopazUpscaleVideoSchema,
  apiType: "topaz-video-upscale",
  build(r) {
    const upscale_factor = r.upscale_factor ?? "2";
    return {
      model: "topaz/video-upscale",
      input: { video_url: r.video_url, upscale_factor },
      label: "Topaz video upscale",
      parameters: { upscale_factor },
    };
  },
  hints: {
    video_url: "Required: video URL (MP4/MOV/MKV, max 50MB)",
    upscale_factor: 'Optional: "1", "2" (default) or "4"',
  },
});
