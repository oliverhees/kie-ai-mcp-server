import { ViduVideoSchema } from "../types.js";
import { marketTool, pick } from "./market-tool.js";

export const viduVideoTool = marketTool({
  name: "vidu_video",
  description:
    "Generate videos with Vidu Q4: image-to-video (one start image) or reference-to-video (up to 15 reference images and 3 voice clips). 3-16s, up to 4K, audio on by default.",
  category: "video",
  schema: ViduVideoSchema,
  apiType: "vidu-video",
  build(r) {
    const isReference = !!r.reference_image_urls?.length;
    const mode = isReference ? "reference-to-video" : "image-to-video";
    const input = isReference
      ? pick(r, [
          "prompt",
          "reference_image_urls",
          "reference_audio_urls",
          "duration",
          "resolution",
          "audio",
          "aspect_ratio",
        ])
      : pick(r, ["image_url", "prompt", "duration", "resolution", "audio"]);
    return {
      model: `vidu-q4/${mode}`,
      input,
      label: `Vidu Q4 ${mode}`,
      parameters: {
        mode,
        duration: r.duration ?? 5,
        resolution: r.resolution ?? "720p",
      },
    };
  },
  hints: {
    image_url: "image-to-video: one start image URL",
    reference_image_urls: "reference-to-video: 1-15 image URLs plus a prompt",
    duration: "Optional: 3-16 seconds (default 5)",
  },
});
