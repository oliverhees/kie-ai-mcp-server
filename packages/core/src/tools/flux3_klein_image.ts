import { Flux3KleinImageSchema } from "../types.js";
import { marketTool, pick } from "./market-tool.js";

export const flux3KleinImageTool = marketTool({
  name: "flux3_klein_image",
  description:
    "Generate or edit images with FLUX 3 Klein (fast and cheap: 1.6 credits at 1K). Text-to-image, or edit with up to 10 input images. 1K-4K or custom size, 1-4 images.",
  category: "image",
  schema: Flux3KleinImageSchema,
  apiType: "flux3-image",
  build(r) {
    const isEdit = !!r.image_urls?.length;
    const mode = isEdit ? "edit-image" : "text-to-image";
    const input = pick(r, [
      "prompt",
      "image_urls",
      "aspect_ratio",
      "resolution",
      "width",
      "height",
      "output_format",
      "num_images",
      "seed",
      "enhance_prompt",
      "nsfw_checker",
    ]);
    return {
      model: `flux-3/klein-${mode}`,
      input,
      label: `FLUX 3 Klein ${mode}`,
      parameters: {
        mode,
        resolution: r.resolution ?? "1K",
        num_images: r.num_images ?? 1,
      },
    };
  },
  hints: {
    prompt: "Required: prompt (max 5000 chars)",
    image_urls: "Optional: 1-10 image URLs -> edit mode",
    width: "Optional: width + height together (256-4096)",
  },
});
