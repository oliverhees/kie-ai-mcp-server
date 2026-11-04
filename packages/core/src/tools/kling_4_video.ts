import { Kling4VideoSchema, resolveKling4Mode } from "../types.js";
import { marketTool, pick } from "./market-tool.js";

export const kling4VideoTool = marketTool({
  name: "kling_4_video",
  description:
    "Generate videos with Kling 4.0: reference-to-video (up to 10 images, 5 videos, 7 subjects, 3 voices, or plain text) or keyframe-to-video (first, middle and last frames). 3-30s, 720p/1080p, native audio. Mode is auto-detected.",
  category: "video",
  schema: Kling4VideoSchema,
  apiType: "kling-4.0-video",
  build(r) {
    const mode = resolveKling4Mode(r);
    const input =
      mode === "keyframe-to-video"
        ? pick(r, [
            "prompt",
            "duration",
            "resolution",
            "aspect_ratio",
            "first_frame_url",
            "keyframe_urls",
            "last_frame_url",
          ])
        : pick(r, [
            "prompt",
            "duration",
            "resolution",
            "aspect_ratio",
            "image_urls",
            "video_urls",
            "keep_original_sound",
            "elements",
            "voices",
          ]);
    return {
      model: `kling-4.0/${mode}`,
      input,
      label: `Kling 4.0 ${mode}`,
      parameters: {
        mode,
        duration: r.duration ?? 5,
        resolution: r.resolution ?? "720p",
      },
    };
  },
  hints: {
    prompt:
      "Required: prompt (max 8000 chars) with @image_1 / @video_1 / @name / @first_frame mentions",
    duration: "Optional: 3-30 seconds (default 5)",
    first_frame_url:
      "keyframe mode: first_frame_url, keyframe_urls (max 8), last_frame_url",
  },
});
