import { KlingOmniVideoSchema, resolveKlingOmniMode } from "../types.js";
import { marketTool, pick } from "./market-tool.js";

export const klingOmniVideoTool = marketTool({
  name: "kling_omni_video",
  description:
    "Generate videos with Kling 3.0 Omni: text-to-video, image-to-video (first/last frame), reference-to-video (images, a video, @subjects) and transformation (restyle a video). 3-15s, up to 4K, multi-shot, native audio. Mode is auto-detected.",
  category: "video",
  schema: KlingOmniVideoSchema,
  apiType: "kling-3.0-omni-video",
  build(r) {
    const mode = resolveKlingOmniMode(r);
    const hasVideo = !!r.video_urls?.length;
    const input = pick(r, [
      "prompt",
      "image_urls",
      "video_urls",
      "resolution",
      "customize_multi_shots",
      "prefer_multi_shots",
      "multi_prompt",
      "elements",
    ]);
    if (!(hasVideo && !r.image_urls?.length)) input.duration = r.duration ?? 5;
    input.audio = hasVideo ? false : (r.audio ?? false);
    const followsInput =
      hasVideo && !r.image_urls?.length
        ? true
        : mode === "image-to-video" && !r.customize_multi_shots;
    input.aspect_ratio = followsInput
      ? "auto"
      : r.aspect_ratio && r.aspect_ratio !== "auto"
        ? r.aspect_ratio
        : "16:9";
    if (mode === "transformation" && r.image_urls?.length)
      input.duration = String(input.duration);
    return {
      model: `kling-3.0-omni/${mode}`,
      input,
      label: `Kling 3.0 Omni ${mode}`,
      parameters: { mode, resolution: r.resolution ?? "720p" },
    };
  },
  hints: {
    prompt: "Required: prompt (max 3072 chars), subjects as @name",
    image_urls: "1-2 images (first/last frame) or up to 7 references",
    video_urls:
      "Optional: exactly 1 video (3-15.5s) for reference/transformation",
    mode: "Optional: text-to-video | image-to-video | reference-to-video | transformation",
  },
});
