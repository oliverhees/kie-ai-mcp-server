import { z } from "zod";

// Zod schemas for request validation
// Nano Banana 2 - powered by Gemini 3.1 Flash Image
export const NanoBananaImageSchema = z
  .object({
    model: z
      .enum([
        "nano-banana-2",
        "nano-banana-2-lite",
        "nano-banana-pro",
        "nano-banana-2-1",
      ])
      .default("nano-banana-2")
      .optional()
      .describe(
        "Nano Banana model: nano-banana-2 supports up to 4K and 14 references; nano-banana-2-lite is the faster 1K model with up to 10 references; nano-banana-pro (up to 4K, 8 references, no 1:4/4:1/1:8/8:1); nano-banana-2-1 (up to 4K, 10 references)",
      ),
    // Text-to-image parameters
    prompt: z
      .string()
      .min(1)
      .max(5000)
      .optional()
      .describe(
        "Text prompt for image generation or editing (max 20000 chars). Nano Banana models support up to 20K characters.",
      ),

    // Edit mode parameters - up to 14 reference images for multi-reference
    image_input: z
      .array(z.string().url())
      .min(1)
      .max(14)
      .optional()
      .describe(
        "Array of reference image URLs for editing mode (up to 14 images for multi-reference)",
      ),

    // Common parameters for generate/edit modes
    output_format: z
      .enum(["png", "jpg"])
      .default("png")
      .optional()
      .describe("Output format for generate/edit modes"),
    aspect_ratio: z
      .enum([
        "1:1",
        "1:4",
        "1:8",
        "2:3",
        "3:2",
        "3:4",
        "4:1",
        "4:3",
        "4:5",
        "5:4",
        "8:1",
        "9:16",
        "16:9",
        "21:9",
        "auto",
      ])
      .default("1:1")
      .optional()
      .describe("Aspect ratio for generate/edit modes"),
    resolution: z
      .enum(["1K", "2K", "4K"])
      .default("1K")
      .optional()
      .describe(
        "Output resolution: 1K (8 credits), 2K (12 credits), 4K (18 credits)",
      ),
    google_search: z
      .boolean()
      .default(false)
      .optional()
      .describe("Enable Google Search grounding for factual image generation"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional URL for task completion notifications (uses KIE_AI_CALLBACK_URL if not provided)",
      ),
  })
  .refine(
    (data) => {
      // Smart mode detection and validation
      const hasPrompt = !!data.prompt;
      const hasImageInput = !!data.image_input && data.image_input.length > 0;

      const refs = data.image_input?.length || 0;
      if (data.model === "nano-banana-pro") {
        if (refs > 8) return false;
        if (["1:4", "4:1", "1:8", "8:1"].includes(data.aspect_ratio ?? ""))
          return false;
      }
      if (data.model === "nano-banana-2-1" && refs > 10) return false;

      if (
        data.model === "nano-banana-2-lite" &&
        ((data.image_input?.length || 0) > 10 ||
          (data.resolution !== undefined && data.resolution !== "1K"))
      ) {
        return false;
      }

      // Edit mode: requires prompt and image_input
      if (hasImageInput) {
        return hasPrompt;
      }

      // Generate mode: requires prompt only
      if (hasPrompt) {
        return true;
      }

      // No valid mode detected
      return false;
    },
    {
      message:
        "Invalid parameter combination. Provide either: 1) prompt only (generate mode), or 2) prompt + image_input (edit mode). Limits: nano-banana-2-lite max 10 references at 1K; nano-banana-pro max 8 references and no 1:4/4:1/1:8/8:1; nano-banana-2-1 max 10 references",
      path: [],
    },
  );

export const Veo3GenerateSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(2000)
    .describe("Text prompt describing desired video content"),
  imageUrls: z
    .array(z.string().url())
    .min(1)
    .max(2)
    .optional()
    .describe(
      "Image URLs for image-to-video generation: 1 image (video unfolds around it) or 2 images (first=start frame, second=end frame)",
    ),
  model: z
    .enum(["veo3", "veo3_fast"])
    .default("veo3")
    .describe("Model type: veo3 (quality) or veo3_fast (cost-efficient)"),
  watermark: z
    .string()
    .max(100)
    .optional()
    .describe("Watermark text to add to video"),
  aspectRatio: z
    .enum(["16:9", "9:16", "Auto"])
    .default("16:9")
    .describe("Video aspect ratio (16:9 supports 1080P)"),
  seeds: z
    .number()
    .int()
    .min(10000)
    .max(99999)
    .optional()
    .describe("Random seed for consistent results"),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe("Callback URL for task completion notifications"),
  enableFallback: z
    .boolean()
    .default(false)
    .describe(
      "Enable fallback mechanism for content policy failures (Note: fallback videos cannot use 1080P endpoint)",
    ),
  enableTranslation: z
    .boolean()
    .default(true)
    .optional()
    .describe("Auto-translate prompts to English for better results"),
});

export const SunoGenerateSchema = z
  .strictObject({
    prompt: z
      .string()
      .max(5000)
      .optional()
      .describe(
        "Optional lyrics fallback in custom mode; core idea in non-custom mode (max 3000 chars). Prompt alone is not sufficient.",
      ),
    lyrics: z
      .string()
      .max(5000)
      .optional()
      .describe(
        "Lyrics, up to 5000 characters; takes priority over prompt in custom mode",
      ),
    image_urls: z
      .array(z.string().url())
      .min(1)
      .max(5)
      .optional()
      .describe("Non-custom mode image references, up to 5"),
    video_urls: z
      .array(z.string().url())
      .min(1)
      .max(1)
      .optional()
      .describe("Non-custom mode video reference, up to 1"),
    audio_urls: z
      .array(z.string().url())
      .min(1)
      .max(10)
      .optional()
      .describe(
        "Non-custom mode audio references; all attachments together must not exceed 10",
      ),
    customMode: z
      .boolean()
      .describe(
        "Custom mode requires title and at least one of style, lyrics, or negativeTags. Non-custom mode requires style, lyrics, or media references.",
      ),
    instrumental: z
      .boolean()
      .describe(
        "Generate instrumental music (no lyrics). In custom mode: if true, only style and title required; if false, prompt used as exact lyrics",
      ),
    model: z
      .enum(["V6", "V6_MINI", "V6_WILD"])
      .default("V6")
      .optional()
      .describe("AI model version for generation"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "URL to receive task completion updates (optional, will use KIE_AI_CALLBACK_URL env var if not provided)",
      ),
    style: z
      .string()
      .max(1000)
      .optional()
      .describe("Music style/genre, up to 1000 characters"),
    title: z
      .string()
      .max(80)
      .optional()
      .describe("Track title (required in custom mode, max 80 chars)"),
    duration: z
      .number()
      .min(10)
      .max(360)
      .optional()
      .describe(
        "Requested track duration in seconds, 10-360, custom mode only; provider default is 20",
      ),
    negativeTags: z.string().optional().describe("Music styles to exclude"),
    variety: z
      .number()
      .int()
      .min(0)
      .max(4)
      .optional()
      .describe("Custom mode variation, 0-4; provider default is 1"),
    personaId: z
      .string()
      .min(1)
      .optional()
      .describe("Existing persona or voice ID"),
    personaModel: z
      .enum(["style_persona", "voice_persona"])
      .optional()
      .describe("Persona model"),
    vocalGender: z
      .enum(["m", "f"])
      .optional()
      .describe(
        "Vocal gender preference (optional, only effective in custom mode)",
      ),
    styleWeight: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.01)
      .optional()
      .describe(
        "Strength of style adherence (optional, range 0-1, up to 2 decimal places)",
      ),
    weirdnessConstraint: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.01)
      .optional()
      .describe(
        "Controls experimental/creative deviation (optional, range 0-1, up to 2 decimal places)",
      ),
    audioWeight: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.01)
      .optional()
      .describe(
        "Balance weight for audio features (optional, range 0-1, up to 2 decimal places)",
      ),
  })
  .superRefine((data, ctx) => {
    const mediaCount =
      (data.image_urls?.length ?? 0) +
      (data.video_urls?.length ?? 0) +
      (data.audio_urls?.length ?? 0);
    if (data.customMode) {
      if (!data.title?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["title"],
          message: "Custom mode requires title",
        });
      if (
        !data.style?.trim() &&
        !data.lyrics?.trim() &&
        !data.negativeTags?.trim()
      )
        ctx.addIssue({
          code: "custom",
          message: "Custom mode requires style, lyrics, or negativeTags",
        });
      if (mediaCount)
        ctx.addIssue({
          code: "custom",
          message: "Media references are only supported in non-custom mode",
        });
    } else {
      if ((data.prompt?.length ?? 0) > 3000)
        ctx.addIssue({
          code: "custom",
          path: ["prompt"],
          message: "Non-custom prompt must not exceed 3000 characters",
        });
      const attachments =
        mediaCount +
        Number(Boolean(data.style?.trim())) +
        Number(Boolean(data.lyrics?.trim()));
      if (!attachments || attachments > 10)
        ctx.addIssue({
          code: "custom",
          message:
            "Non-custom mode requires 1-10 attachments: style, lyrics, or media references",
        });
      for (const key of [
        "duration",
        "vocalGender",
        "styleWeight",
        "weirdnessConstraint",
        "audioWeight",
        "variety",
      ] as const) {
        if (data[key] !== undefined)
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is only supported in custom mode`,
          });
      }
    }
    if (data.instrumental && data.audioWeight !== undefined)
      ctx.addIssue({
        code: "custom",
        path: ["audioWeight"],
        message: "audioWeight requires vocals",
      });
  });

export const ElevenLabsTTSSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(5000)
    .describe("The text to convert to speech (max 5000 characters)"),
  model: z
    .enum(["turbo", "multilingual"])
    .default("turbo")
    .optional()
    .describe(
      "TTS model to use - turbo (faster, default) or multilingual (supports context)",
    ),
  voice: z
    .enum([
      "Rachel",
      "Aria",
      "Roger",
      "Sarah",
      "Laura",
      "Charlie",
      "George",
      "Callum",
      "River",
      "Liam",
      "Charlotte",
      "Alice",
      "Matilda",
      "Will",
      "Jessica",
      "Eric",
      "Chris",
      "Brian",
      "Daniel",
      "Lily",
      "Bill",
    ])
    .default("Rachel")
    .optional()
    .describe("Voice to use for speech generation"),
  stability: z
    .number()
    .min(0)
    .max(1)
    .multipleOf(0.01)
    .default(0.5)
    .optional()
    .describe("Voice stability (0-1, step 0.01)"),
  similarity_boost: z
    .number()
    .min(0)
    .max(1)
    .multipleOf(0.01)
    .default(0.75)
    .optional()
    .describe("Similarity boost (0-1, step 0.01)"),
  style: z
    .number()
    .min(0)
    .max(1)
    .multipleOf(0.01)
    .default(0)
    .optional()
    .describe("Style exaggeration (0-1, step 0.01)"),
  speed: z
    .number()
    .min(0.7)
    .max(1.2)
    .multipleOf(0.01)
    .default(1)
    .optional()
    .describe("Speech speed (0.7-1.2, step 0.01)"),
  timestamps: z
    .boolean()
    .default(false)
    .optional()
    .describe("Whether to return timestamps for each word"),
  previous_text: z
    .string()
    .max(5000)
    .default("")
    .optional()
    .describe(
      "Text that came before current request (multilingual model only, max 5000 characters)",
    ),
  next_text: z
    .string()
    .max(5000)
    .default("")
    .optional()
    .describe(
      "Text that comes after current request (multilingual model only, max 5000 characters)",
    ),
  language_code: z
    .string()
    .max(500)
    .default("")
    .optional()
    .describe(
      "Language code (ISO 639-1) for language enforcement (turbo model only)",
    ),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
    ),
});

export const ElevenLabsSoundEffectsSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(5000)
    .describe(
      "The text describing the sound effect to generate (max 5000 characters)",
    ),
  loop: z
    .boolean()
    .default(false)
    .optional()
    .describe("Whether to create a sound effect that loops smoothly"),
  duration_seconds: z
    .number()
    .min(0.5)
    .max(22)
    .multipleOf(0.1)
    .optional()
    .describe(
      "Duration in seconds (0.5-22). If not specified, optimal duration will be determined from prompt",
    ),
  prompt_influence: z
    .number()
    .min(0)
    .max(1)
    .multipleOf(0.01)
    .default(0.3)
    .optional()
    .describe(
      "How closely to follow the prompt (0-1). Higher values mean less variation",
    ),
  output_format: z
    .enum([
      "mp3_22050_32",
      "mp3_44100_32",
      "mp3_44100_64",
      "mp3_44100_96",
      "mp3_44100_128",
      "mp3_44100_192",
      "pcm_8000",
      "pcm_16000",
      "pcm_22050",
      "pcm_24000",
      "pcm_44100",
      "pcm_48000",
      "ulaw_8000",
      "alaw_8000",
      "opus_48000_32",
      "opus_48000_64",
      "opus_48000_96",
      "opus_48000_128",
      "opus_48000_192",
    ])
    .default("mp3_44100_192")
    .optional()
    .describe("Output format of the generated audio"),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
    ),
});

// ByteDance Seedance 2.5 video generation.
export const ByteDanceSeedanceVideoSchema = z
  .object({
    prompt: z.string().min(1).describe("Text prompt for video generation"),
    extension_task_id: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Experimental: previous Seedance task ID used as semantic continuation context; does not guarantee frame-to-frame continuity",
      ),
    first_frame_url: z
      .string()
      .url()
      .optional()
      .describe("URL of the first-frame image for image-to-video"),
    last_frame_url: z
      .string()
      .url()
      .optional()
      .describe("URL of the last-frame image; requires first_frame_url"),
    reference_image_urls: z
      .array(z.string().url())
      .optional()
      .describe("Reference image URLs for multimodal reference-to-video"),
    reference_video_urls: z
      .array(z.string().url())
      .optional()
      .describe("Reference video URLs for multimodal reference-to-video"),
    reference_audio_urls: z
      .array(z.string().url())
      .optional()
      .describe("Reference audio URLs for multimodal reference-to-video"),
    return_last_frame: z
      .boolean()
      .optional()
      .describe("Return the generated last frame when requested"),
    generate_audio: z
      .boolean()
      .optional()
      .describe("Generate audio for the video when requested"),
    resolution: z
      .string()
      .min(1)
      .optional()
      .describe("Output resolution (the official example uses 720p)"),
    aspect_ratio: z
      .string()
      .min(1)
      .optional()
      .describe("Aspect ratio of the generated video"),
    duration: z
      .number()
      .int()
      .optional()
      .describe("Video duration in seconds (the official example uses 15)"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasFrames = Boolean(data.first_frame_url || data.last_frame_url);
    const hasReferences = Boolean(
      data.reference_image_urls?.length ||
        data.reference_video_urls?.length ||
        data.reference_audio_urls?.length,
    );

    if (data.last_frame_url && !data.first_frame_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last_frame_url"],
        message: "last_frame_url requires first_frame_url.",
      });
    }

    if (hasFrames && hasReferences) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message:
          "Frame inputs and multimodal reference inputs are mutually exclusive.",
      });
    }
  });

export const RunwayAlephVideoSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(1000)
    .describe(
      "Text prompt describing the desired video transformation (max 1000 characters)",
    ),
  videoUrl: z.string().url().describe("URL of the input video to transform"),
  waterMark: z
    .string()
    .max(100)
    .default("")
    .optional()
    .describe("Watermark text to add to the video"),
  uploadCn: z
    .boolean()
    .default(false)
    .optional()
    .describe("Whether to upload to China servers"),
  aspectRatio: z
    .enum(["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"])
    .default("16:9")
    .optional()
    .describe("Aspect ratio of the output video"),
  seed: z
    .number()
    .int()
    .min(1)
    .max(999999)
    .optional()
    .describe("Random seed for reproducible results (1-999999)"),
  referenceImage: z
    .string()
    .url()
    .optional()
    .describe("URL of reference image for style guidance"),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
    ),
});

export const Wan30VideoSchema = z
  .object({
    model: z
      .enum(["wan/3-0-video", "wan/3-0-video-prime"])
      .default("wan/3-0-video")
      .optional()
      .describe("Wan 3.0 standard or high-speed Prime"),
    prompt: z
      .string()
      .min(1)
      .max(20000)
      .optional()
      .describe(
        "Text prompt for video generation (max 20000 characters). Required when no media reference is provided.",
      ),
    first_frame_url: z
      .string()
      .url()
      .optional()
      .describe(
        "URL of the first-frame image (cannot be mixed with reference_*_urls)",
      ),
    last_frame_url: z
      .string()
      .url()
      .optional()
      .describe("URL of the last-frame image; requires first_frame_url"),
    reference_image_urls: z
      .array(z.string().url())
      .max(10)
      .optional()
      .describe(
        "Reference image URLs mapped to Image1, Image2, and so on (up to 10)",
      ),
    reference_video_urls: z
      .array(z.string().url())
      .max(5)
      .optional()
      .describe(
        "Reference video URLs mapped to Video1, Video2, and so on (up to 5)",
      ),
    reference_audio_urls: z
      .array(z.string().url())
      .max(5)
      .optional()
      .describe(
        "Reference audio URLs mapped to Audio1, Audio2, and so on (up to 5)",
      ),
    reference_file_urls: z
      .array(z.string().url())
      .max(1)
      .optional()
      .describe("Public document URL for file-to-video generation (maximum 1)"),
    reference_link_urls: z
      .array(z.string().url())
      .max(1)
      .optional()
      .describe("Public webpage URL for link-to-video generation (maximum 1)"),
    resolution: z
      .enum(["480P", "720P", "1080P"])
      .default("1080P")
      .optional()
      .describe("Video resolution"),
    aspect_ratio: z
      .enum(["adaptive", "16:9", "4:3", "1:1", "3:4", "9:16"])
      .default("adaptive")
      .optional()
      .describe("Aspect ratio of the generated video"),
    duration: z
      .union([z.literal(-1), z.number().int().min(2).max(30)])
      .default(5)
      .optional()
      .describe("Duration in seconds (2-30), or -1 for smart duration"),
    audio: z
      .boolean()
      .default(true)
      .optional()
      .describe("Whether the generated video includes an audio track"),
    seed: z
      .number()
      .int()
      .min(0)
      .max(2147483647)
      .optional()
      .describe("Random seed for reproducible results (0-2147483647)"),
    nsfw_checker: z.boolean().optional().describe("Enable NSFW content filter"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional: URL for task completion notifications"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasReferences = Boolean(
      data.reference_image_urls?.length ||
        data.reference_video_urls?.length ||
        data.reference_audio_urls?.length ||
        data.reference_file_urls?.length ||
        data.reference_link_urls?.length,
    );
    if (!data.prompt && !data.first_frame_url && !hasReferences) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide prompt, first_frame_url, or at least one reference URL",
      });
    }
    if (data.last_frame_url && !data.first_frame_url) {
      ctx.addIssue({
        code: "custom",
        path: ["last_frame_url"],
        message: "last_frame_url requires first_frame_url",
      });
    }
    if ((data.first_frame_url || data.last_frame_url) && hasReferences) {
      ctx.addIssue({
        code: "custom",
        message:
          "First/last frame URLs cannot be combined with reference_*_urls",
      });
    }
    if (data.reference_file_urls?.length && data.reference_link_urls?.length) {
      ctx.addIssue({
        code: "custom",
        message:
          "reference_file_urls and reference_link_urls are mutually exclusive",
      });
    }
  });

export const ByteDanceSeedreamImageSchema = z
  .strictObject({
    version: z
      .enum(["5-pro", "5-flash"])
      .default("5-pro")
      .optional()
      .describe("Seedream 5 Pro or Flash; older versions are removed"),
    operation: z
      .enum(["generate", "layer-decomposition"])
      .optional()
      .describe(
        "Defaults to layer-decomposition with image_url, otherwise generate/edit",
      ),
    prompt: z
      .string()
      .max(5000)
      .optional()
      .describe(
        "3-5000 characters for generation/editing; optional for layer decomposition",
      ),
    image_urls: z
      .array(z.string().url())
      .min(1)
      .max(10)
      .optional()
      .describe("Up to 10 reference images for editing"),
    image_url: z
      .string()
      .url()
      .optional()
      .describe(
        "Single source image for layer decomposition; cannot be combined with image_urls",
      ),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"])
      .optional()
      .describe("Generation/edit aspect ratio, default 1:1"),
    quality: z
      .enum(["basic", "high"])
      .optional()
      .describe("Pro generation/edit only: basic = 1K, high = 2K"),
    size: z
      .enum(["auto", "1K", "1.5K", "2K"])
      .optional()
      .describe(
        "Flash generation/edit size, default 1K; layer decomposition size, default auto",
      ),
    output_format: z
      .enum(["png", "jpeg"])
      .optional()
      .describe(
        "Generation default png; layer base image default jpeg, separated layers are PNG",
      ),
    nsfw_checker: z
      .boolean()
      .optional()
      .describe(
        "Generation/edit content filtering; unavailable for layer decomposition",
      ),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional callback URL, with KIE_AI_CALLBACK_URL fallback"),
  })
  .superRefine((data, ctx) => {
    const layers =
      data.operation === "layer-decomposition" ||
      (!data.operation && Boolean(data.image_url));
    if (layers) {
      if (!data.image_url)
        ctx.addIssue({
          code: "custom",
          path: ["image_url"],
          message: "Layer decomposition requires image_url",
        });
      for (const key of [
        "image_urls",
        "aspect_ratio",
        "quality",
        "nsfw_checker",
      ] as const) {
        if (data[key] !== undefined)
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is not supported for layer decomposition`,
          });
      }
      if (
        data.version === "5-flash" &&
        data.prompt !== undefined &&
        data.prompt.length < 3
      )
        ctx.addIssue({
          code: "custom",
          path: ["prompt"],
          message:
            "Flash layer prompt must contain at least 3 characters when provided",
        });
    } else {
      if (!data.prompt || data.prompt.length < 3)
        ctx.addIssue({
          code: "custom",
          path: ["prompt"],
          message: "Generation/editing requires a prompt of 3-5000 characters",
        });
      if (data.image_url)
        ctx.addIssue({
          code: "custom",
          path: ["image_url"],
          message: "image_url is only supported for layer decomposition",
        });
      if (data.version === "5-flash") {
        if (data.quality !== undefined || data.size === "auto")
          ctx.addIssue({
            code: "custom",
            message:
              "Flash generation uses size 1K/1.5K/2K, not quality or auto",
          });
      } else if (data.size !== undefined)
        ctx.addIssue({
          code: "custom",
          path: ["size"],
          message: "Pro generation uses quality, not size",
        });
    }
  });

export const WanImageSchema = z
  .strictObject({
    model: z
      .enum(["wan/2-7-image", "wan/2-7-image-pro"])
      .default("wan/2-7-image")
      .optional()
      .describe("Wan 2.7 Image standard or Pro"),
    prompt: z
      .string()
      .min(1)
      .max(5000)
      .describe("Image generation/editing prompt, up to 5000 characters"),
    input_urls: z
      .array(z.string().url())
      .min(1)
      .max(9)
      .optional()
      .describe("Up to 9 input images; omit for text-to-image"),
    aspect_ratio: z
      .enum(["1:1", "16:9", "4:3", "21:9", "3:4", "9:16", "8:1", "1:8"])
      .optional()
      .describe("Output ratio for text-to-image only"),
    enable_sequential: z
      .boolean()
      .default(false)
      .optional()
      .describe("Enable group/sequential image generation"),
    n: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe(
        "1-4 in standard mode, 1-12 in sequential mode; default 4 or 12 respectively",
      ),
    resolution: z
      .enum(["1K", "2K", "4K"])
      .default("2K")
      .optional()
      .describe(
        "Output resolution; Pro 4K is only available for non-sequential text-to-image",
      ),
    thinking_mode: z
      .boolean()
      .optional()
      .describe("Available only for non-sequential text-to-image"),
    color_palette: z
      .array(
        z.strictObject({
          hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
          ratio: z.string().regex(/^\d{1,3}\.\d{2}%$/),
        }),
      )
      .min(3)
      .max(10)
      .optional()
      .describe("3-10 colors with xx.xx% ratios; non-sequential mode only"),
    bbox_list: z
      .array(
        z
          .array(
            z.tuple([
              z.number().int(),
              z.number().int(),
              z.number().int(),
              z.number().int(),
            ]),
          )
          .max(2),
      )
      .optional()
      .describe(
        "Editing boxes, one list per input image, up to two [x1,y1,x2,y2] boxes per image",
      ),
    watermark: z.boolean().optional().describe("Add a watermark"),
    seed: z
      .number()
      .int()
      .min(0)
      .max(2147483647)
      .optional()
      .describe("Random seed"),
    nsfw_checker: z.boolean().optional().describe("Enable content filtering"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional callback URL, with KIE_AI_CALLBACK_URL fallback"),
  })
  .superRefine((data, ctx) => {
    const editing = Boolean(data.input_urls?.length);
    if (!data.enable_sequential && (data.n ?? 4) > 4)
      ctx.addIssue({
        code: "custom",
        path: ["n"],
        message: "Non-sequential mode supports at most 4 images",
      });
    if (data.thinking_mode && (editing || data.enable_sequential))
      ctx.addIssue({
        code: "custom",
        path: ["thinking_mode"],
        message: "Thinking mode requires non-sequential text-to-image",
      });
    if (data.color_palette && data.enable_sequential)
      ctx.addIssue({
        code: "custom",
        path: ["color_palette"],
        message: "Color palettes are unavailable in sequential mode",
      });
    if (editing && data.aspect_ratio !== undefined)
      ctx.addIssue({
        code: "custom",
        path: ["aspect_ratio"],
        message: "aspect_ratio is only supported for text-to-image",
      });
    if (
      data.bbox_list &&
      (!editing || data.bbox_list.length !== data.input_urls?.length)
    )
      ctx.addIssue({
        code: "custom",
        path: ["bbox_list"],
        message: "bbox_list must have one entry per input image",
      });
    if (
      data.model === "wan/2-7-image-pro" &&
      data.resolution === "4K" &&
      (editing || data.enable_sequential)
    )
      ctx.addIssue({
        code: "custom",
        path: ["resolution"],
        message: "Pro 4K requires non-sequential text-to-image",
      });
  });
export type WanImageRequest = z.infer<typeof WanImageSchema>;

export const OmniHumanVideoSchema = z.object({
  image_url: z.string().url().describe("Portrait image URL to animate"),
  audio_url: z.string().url().describe("Audio URL that drives the animation"),
  mask_url: z.array(z.string().url()).max(5).optional(),
  prompt: z.string().max(1000).optional(),
  output_resolution: z.enum(["720", "1080"]).default("1080").optional(),
  pe_fast_mode: z.boolean().default(false).optional(),
  seed: z.number().int().default(-1).optional(),
  callBackUrl: z.string().url().optional(),
});

export const GeminiOmniSchema = z
  .object({
    operation: z
      .enum(["video", "character", "audio"])
      .default("video")
      .optional(),
    prompt: z.string().max(20000).optional(),
    image_urls: z.array(z.string().url()).max(7).optional(),
    audio_ids: z.array(z.string()).max(3).optional(),
    video_list: z
      .array(
        z.object({
          url: z.string().url(),
          start: z.number().min(0),
          ends: z.number().min(0),
        }),
      )
      .max(1)
      .optional(),
    character_ids: z.array(z.string()).max(3).optional(),
    duration: z.enum(["4", "6", "8", "10"]).optional(),
    aspect_ratio: z.enum(["16:9", "9:16"]).optional(),
    resolution: z.enum(["720p", "1080p", "4k"]).optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    character_name: z.string().max(210).optional(),
    descriptions: z.string().max(20000).optional(),
    audio_id: z.string().optional(),
    name: z.string().max(210).optional(),
    voice_description: z.string().max(20000).optional(),
    example_dialogue: z.string().max(120).optional(),
    callBackUrl: z.string().url().optional(),
  })
  .refine(
    (data) => {
      if (data.operation === "audio") return !!data.audio_id && !!data.name;
      if (data.operation === "character")
        return !!data.descriptions && data.image_urls?.length === 1;
      const video = data.video_list?.[0];
      const quota =
        (data.image_urls?.length || 0) +
        (video ? 2 : 0) +
        (data.character_ids?.length || 0);
      return (
        !!data.prompt && (!video || video.ends > video.start) && quota <= 7
      );
    },
    {
      message: "Invalid Gemini Omni operation inputs or video quota",
      path: [],
    },
  );

// Z-Image - Tongyi-MAI fast text-to-image with bilingual text rendering
export const ZImageSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(5000)
    .describe(
      "Text prompt describing the desired image (max 5000 characters). Supports bilingual prompts.",
    ),
  aspect_ratio: z
    .enum(["1:1", "4:3", "3:4", "16:9", "9:16"])
    .default("1:1")
    .describe("Aspect ratio for the generated image"),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
    ),
});

export type ZImageRequest = z.infer<typeof ZImageSchema>;

// Grok Imagine - xAI multimodal image/video generation.
// Image modes use Grok Imagine Image 2.0; video and upscale remain on Grok Imagine.
export const GrokImagineSchema = z
  .object({
    prompt: z
      .string()
      .max(5000)
      .optional()
      .describe(
        "Text prompt describing the desired content (required for text modes, optional for image-to-video)",
      ),
    // Image-to-video mode: use image_urls OR task_id+index. Image edit accepts up to five URLs.
    image_urls: z
      .array(z.string().url())
      .max(5)
      .optional()
      .describe(
        "Reference image URLs. image-to-video accepts exactly one; image-to-image accepts one to five.",
      ),
    task_id: z
      .string()
      .optional()
      .describe(
        "Task ID from a previous Grok generation (for upscale or image-to-video from generated image)",
      ),
    index: z
      .number()
      .int()
      .min(0)
      .max(5)
      .optional()
      .describe(
        "Image index from task_id (0-5, Grok generates 6 images per task)",
      ),
    // Common parameters
    aspect_ratio: z
      .enum(["1:1", "2:3", "3:2", "16:9", "9:16", "auto"])
      .optional()
      .describe(
        "Aspect ratio. Image 2.0 image modes default to 1:1; image-to-image also accepts auto.",
      ),
    mode: z
      .enum(["fun", "normal", "spicy"])
      .optional()
      .describe(
        "Video generation style: fun, normal, or spicy (spicy is not available with external images)",
      ),
    // Mode selection (auto-detected if not provided)
    generation_mode: z
      .enum([
        "text-to-image",
        "image-to-image",
        "text-to-video",
        "image-to-video",
        "upscale",
      ])
      .optional()
      .describe(
        "Explicit mode selection. image-to-image must be explicit; otherwise image_urls auto-detects image-to-video.",
      ),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional: URL for task completion notifications"),
  })
  .superRefine((data, ctx) => {
    const hasImages = (data.image_urls?.length ?? 0) > 0;
    const effectiveMode =
      data.generation_mode ??
      (data.task_id && !data.prompt && !hasImages
        ? "upscale"
        : data.task_id || hasImages
          ? "image-to-video"
          : "text-to-video");
    const addIssue = (message: string, path: string[]) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });
    const reject = (field: keyof typeof data, message: string) => {
      if (data[field] !== undefined) addIssue(message, [field]);
    };
    const imageRatios = ["1:1", "2:3", "3:2", "16:9", "9:16"];
    const videoRatios = ["1:1", "2:3", "3:2", "16:9", "9:16"];

    switch (effectiveMode) {
      case "text-to-image":
        if (!data.prompt)
          addIssue("prompt is required for text-to-image", ["prompt"]);
        if (data.aspect_ratio && !imageRatios.includes(data.aspect_ratio))
          addIssue(
            "text-to-image aspect_ratio must be 1:1, 2:3, 3:2, 16:9, or 9:16",
            ["aspect_ratio"],
          );
        reject("image_urls", "image_urls is not supported for text-to-image");
        reject("task_id", "task_id is not supported for text-to-image");
        reject("index", "index is not supported for text-to-image");
        reject("mode", "mode is not supported for text-to-image");
        break;
      case "image-to-image":
        if (!data.prompt)
          addIssue("prompt is required for image-to-image", ["prompt"]);
        if (!hasImages)
          addIssue(
            "image_urls with one to five URLs is required for image-to-image",
            ["image_urls"],
          );
        reject("task_id", "task_id is not supported for image-to-image");
        reject("index", "index is not supported for image-to-image");
        reject("mode", "mode is not supported for image-to-image");
        break;
      case "text-to-video":
        if (!data.prompt)
          addIssue("prompt is required for text-to-video", ["prompt"]);
        if (data.aspect_ratio && !videoRatios.includes(data.aspect_ratio))
          addIssue("text-to-video aspect_ratio must be 1:1, 2:3, or 3:2", [
            "aspect_ratio",
          ]);
        reject("image_urls", "image_urls is not supported for text-to-video");
        reject("task_id", "task_id is not supported for text-to-video");
        reject("index", "index is not supported for text-to-video");
        break;
      case "image-to-video":
        if (!hasImages && !data.task_id)
          addIssue("image_urls or task_id is required for image-to-video", [
            "image_urls",
          ]);
        if (hasImages && data.image_urls?.length !== 1)
          addIssue("image-to-video accepts exactly one image URL", [
            "image_urls",
          ]);
        if (hasImages && data.task_id)
          addIssue("image-to-video accepts image_urls or task_id, not both", [
            "task_id",
          ]);
        if (data.index !== undefined && !data.task_id)
          addIssue("index requires task_id", ["index"]);
        if (data.mode === "spicy" && hasImages)
          addIssue("mode spicy is not available with external images", [
            "mode",
          ]);
        break;
      case "upscale":
        if (!data.task_id)
          addIssue("task_id is required for upscale", ["task_id"]);
        reject("prompt", "prompt is not supported for upscale");
        reject("image_urls", "image_urls is not supported for upscale");
        reject("index", "index is not supported for upscale");
        reject("aspect_ratio", "aspect_ratio is not supported for upscale");
        reject("mode", "mode is not supported for upscale");
        break;
    }
  });

export type GrokImagineRequest = z.infer<typeof GrokImagineSchema>;

// InfiniTalk - MeiGen-AI lip sync video generator (image + audio to talking video)
export const InfiniTalkSchema = z.object({
  image_url: z
    .string()
    .url()
    .describe(
      "URL of the portrait image to animate (JPEG, PNG, WEBP, max 10MB)",
    ),
  audio_url: z
    .string()
    .url()
    .describe(
      "URL of the audio file for lip sync (MPEG, WAV, AAC, MP4, OGG, max 10MB)",
    ),
  prompt: z
    .string()
    .min(1)
    .max(1500)
    .describe(
      "Text prompt to guide video generation (e.g., 'A young woman talking on a podcast')",
    ),
  resolution: z
    .enum(["480p", "720p"])
    .default("480p")
    .optional()
    .describe(
      "Video resolution: 480p (faster, cheaper) or 720p (higher quality)",
    ),
  seed: z
    .number()
    .int()
    .min(10000)
    .max(1000000)
    .optional()
    .describe("Random seed for reproducibility (10000-1000000)"),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe("Optional: URL for task completion notifications"),
});

export type InfiniTalkRequest = z.infer<typeof InfiniTalkSchema>;

// Kling Avatar - Kuaishou talking avatar video generator (image + audio to avatar video)
export const KlingAvatarSchema = z.object({
  image_url: z
    .string()
    .url()
    .describe(
      "URL of the portrait image for avatar (JPEG, PNG, WEBP, max 10MB)",
    ),
  audio_url: z
    .string()
    .url()
    .describe(
      "URL of the audio file for the avatar to speak (MPEG, WAV, AAC, MP4, OGG, max 10MB)",
    ),
  prompt: z
    .string()
    .min(1)
    .max(1500)
    .describe(
      "Text prompt to guide video generation (emotions, expressions, scene settings)",
    ),
  // Quality: standard (720P) or pro (1080P)
  quality: z
    .enum(["standard", "pro"])
    .default("standard")
    .optional()
    .describe(
      "Video quality: standard (720P, faster) or pro (1080P, higher quality)",
    ),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe("Optional: URL for task completion notifications"),
});

export type KlingAvatarRequest = z.infer<typeof KlingAvatarSchema>;

// HappyHorse 1.0 Video - Alibaba ATH multi-mode video generation
export const HappyHorseVideoSchema = z
  .strictObject({
    mode: z
      .enum(["text-to-video", "image-to-video", "reference-to-video"])
      .optional()
      .describe(
        "HappyHorse 1.1 mode, auto-detected from image_urls or reference_image. Video editing from 1.0 is removed.",
      ),
    prompt: z
      .string()
      .max(5000)
      .optional()
      .describe(
        "Required for text/reference-to-video, optional for image-to-video; max 4999 for text, 5000 for other modes",
      ),
    // I2V
    image_urls: z
      .array(z.string().url())
      .min(1)
      .max(1)
      .optional()
      .describe("Input image URL for image-to-video mode (max 1)"),
    // R2V
    reference_image: z
      .array(z.string().url())
      .min(1)
      .max(9)
      .optional()
      .describe("Reference images for reference-to-video mode (up to 9)"),
    // Common
    resolution: z
      .enum(["720p", "1080p"])
      .default("1080p")
      .optional()
      .describe("Video resolution"),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1", "4:3", "3:4", "4:5", "5:4", "9:21", "21:9"])
      .optional()
      .describe(
        "Text/reference mode aspect ratio, default 16:9; not available in image-to-video",
      ),
    duration: z
      .number()
      .int()
      .min(3)
      .max(15)
      .default(5)
      .optional()
      .describe("Duration in seconds (3-15)"),
  })
  .superRefine((data, ctx) => {
    const mode =
      data.mode ??
      (data.reference_image?.length
        ? "reference-to-video"
        : data.image_urls?.length
          ? "image-to-video"
          : "text-to-video");
    if (mode !== "image-to-video" && !data.prompt?.trim())
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "Text/reference-to-video requires prompt",
      });
    if (
      mode === "text-to-video" &&
      (data.image_urls ||
        data.reference_image ||
        (data.prompt?.length ?? 0) > 4999)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Text-to-video accepts no image inputs and at most 4999 prompt characters",
      });
    if (
      mode === "image-to-video" &&
      (!data.image_urls || data.reference_image || data.aspect_ratio)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Image-to-video requires image_urls and accepts neither reference_image nor aspect_ratio",
      });
    if (
      mode === "reference-to-video" &&
      (!data.reference_image || data.image_urls)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Reference-to-video requires reference_image and does not accept image_urls",
      });
    if ((data.prompt?.match(/[\u3400-\u9fff]/g)?.length ?? 0) > 2500)
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "Prompt must not exceed 2500 Chinese characters",
      });
  });

export type HappyHorseVideoRequest = z.infer<typeof HappyHorseVideoSchema>;

export const QwenImageSchema = z.strictObject({
  model: z
    .enum(["qwen3", "qwen3-pro"])
    .default("qwen3")
    .optional()
    .describe("Qwen3 standard or Pro; older versions are removed"),
  prompt: z
    .string()
    .min(1)
    .max(5000)
    .describe("Positive prompt, up to 5000 characters"),
  image_urls: z
    .array(z.string().url())
    .min(1)
    .max(3)
    .optional()
    .describe("Up to 3 reference image URLs; omit for text-to-image"),
  resolution: z
    .enum(["1K", "2K"])
    .default("1K")
    .optional()
    .describe("Output resolution"),
  image_size: z
    .enum(["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9"])
    .default("16:9")
    .optional()
    .describe("Output aspect ratio"),
  output_format: z
    .enum(["png", "jpeg"])
    .default("png")
    .optional()
    .describe("Image format"),
  prompt_extend: z
    .boolean()
    .default(true)
    .optional()
    .describe("Enable intelligent prompt rewriting"),
  nsfw_checker: z.boolean().optional().describe("Enable content filtering"),
  negative_prompt: z
    .string()
    .max(5000)
    .optional()
    .describe("Negative prompt, up to 5000 characters"),
  seed: z
    .number()
    .int()
    .min(0)
    .max(2147483647)
    .optional()
    .describe("Random seed"),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe("Optional callback URL, with KIE_AI_CALLBACK_URL fallback"),
});

export const MidjourneyGenerateSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .max(4000)
      .describe(
        "Text prompt describing the desired image or video (max 2000 characters)",
      ),
    fileUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Single image URL for image-to-image or video generation (legacy - use fileUrls instead)",
      ),
    fileUrls: z
      .array(z.string().url())
      .max(5)
      .optional()
      .describe(
        "Array of image URLs for image-to-image or video generation (recommended)",
      ),
    taskType: z
      .enum([
        "mj_txt2img",
        "mj_img2img",
        "mj_style_reference",
        "mj_omni_reference",
        "mj_video",
        "mj_video_hd",
      ])
      .optional()
      .describe(
        "Task type for generation mode (auto-detected if not provided)",
      ),
    aspectRatio: z
      .enum(["1:1", "9:16", "16:9", "4:3", "3:4", "21:9", "2:3", "3:2"])
      .default("1:1")
      .optional()
      .describe("Output aspect ratio"),
    processMode: z.enum(["relax", "fast"]).default("relax").optional(),
    weird: z.number().int().min(0).max(1000).optional(),
    raw: z.boolean().default(false).optional(),
    seed: z.number().int().min(0).max(4294967295).optional(),
    stylize: z.number().int().min(0).max(1000).optional(),
    quality: z.number().min(0.1).max(1).multipleOf(0.1).optional(),
    chaos: z.number().int().min(0).max(100).optional(),
    repeat: z.number().int().min(1).max(40).optional(),
    stop: z.number().int().min(10).max(100).optional(),
    // Video-specific parameters
    motion: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Motion level for video generation (required for video mode)"),
    videoBatchSize: z
      .number()
      .int()
      .min(1)
      .max(4)
      .optional()
      .describe("Number of videos to generate (video mode only)"),
    high_definition_video: z
      .boolean()
      .default(false)
      .optional()
      .describe(
        "Use high definition video generation instead of standard definition",
      ),
    // Omni reference specific
    ow: z
      .string()
      .min(1)
      .max(4000)
      .optional()
      .describe("Omni intensity parameter for omni reference tasks (1-1000)"),
    // Style reference specific
    sref: z.string().min(1).max(4000).optional(),
    // Additional parameters used by client code
    version: z.string().optional().describe("Midjourney model version"),
    speed: z
      .enum(["relax", "fast", "turbo"])
      .optional()
      .describe("Generation speed (not required for video/omni tasks)"),
    variety: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe(
        "Controls diversity of generated results (0-100, increment by 5)",
      ),
    stylization: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .optional()
      .describe("Artistic style intensity (0-1000, suggested multiple of 50)"),
    weirdness: z
      .number()
      .int()
      .min(0)
      .max(3000)
      .optional()
      .describe(
        "Creativity and uniqueness level (0-3000, suggested multiple of 100)",
      ),
    enableTranslation: z
      .boolean()
      .optional()
      .describe("Auto-translate non-English prompts to English"),
    waterMark: z.string().max(100).optional().describe("Watermark identifier"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .refine(
    (data) => {
      // Auto-detect and validate task type based on parameters
      const hasImage =
        data.fileUrl || (data.fileUrls && data.fileUrls.length > 0);
      const isVideoMode =
        data.motion || data.videoBatchSize || data.high_definition_video;
      const isOmniMode = data.taskType === "mj_omni_reference" || data.ow;
      const isStyleMode = data.taskType === "mj_style_reference";

      // If taskType is explicitly provided, validate it
      if (data.taskType) {
        // Video tasks require motion parameter
        if (
          (data.taskType === "mj_video" || data.taskType === "mj_video_hd") &&
          !data.motion
        ) {
          return false;
        }
        // Omni tasks require ow parameter
        if (data.taskType === "mj_omni_reference" && !data.ow) {
          return false;
        }
        // Image tasks require image URL
        if (
          (data.taskType === "mj_img2img" ||
            data.taskType === "mj_style_reference" ||
            data.taskType === "mj_omni_reference") &&
          !hasImage
        ) {
          return false;
        }
        // Video tasks require image URL
        if (
          (data.taskType === "mj_video" || data.taskType === "mj_video_hd") &&
          !hasImage
        ) {
          return false;
        }
        // Text-to-image should not have image URL
        if (data.taskType === "mj_txt2img" && hasImage) {
          return false;
        }
      }

      return true;
    },
    {
      message: "Invalid combination of parameters for the detected task type",
      path: [],
    },
  );

export const GptImage2Schema = z
  .strictObject({
    model: z
      .enum(["flare", "sunburst"])
      .default("flare")
      .optional()
      .describe("GPT Image 2.5 variant; GPT Image 2 routing is removed"),
    prompt: z
      .string()
      .min(1)
      .max(20000)
      .describe(
        "Text prompt describing the desired image (max 20000 characters)",
      ),
    input_urls: z
      .array(z.string().url())
      .min(1)
      .max(16)
      .optional()
      .describe(
        "Array of up to 16 image URLs for image-to-image mode. Omit for text-to-image.",
      ),
    aspect_ratio: z
      .enum([
        "auto",
        "1:1",
        "3:2",
        "2:3",
        "4:3",
        "3:4",
        "16:9",
        "9:16",
        "21:9",
        "27:16",
        "16:27",
        "9:8",
        "8:9",
      ])
      .default("auto")
      .optional()
      .describe("Image aspect ratio"),
    resolution: z
      .enum(["1K", "2K", "4K"])
      .default("1K")
      .optional()
      .describe("Output resolution"),
    background: z
      .enum(["transparent", "opaque", "auto"])
      .optional()
      .describe("Image background"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .refine(
    (data) =>
      !["27:16", "16:27", "9:8", "8:9"].includes(data.aspect_ratio ?? "auto") ||
      (data.resolution ?? "1K") === "1K",
    {
      message: "27:16, 16:27, 9:8 and 8:9 support 1K only",
      path: ["resolution"],
    },
  );

// TypeScript types
export type NanoBananaImageRequest = z.infer<typeof NanoBananaImageSchema>;
export type Veo3GenerateRequest = z.infer<typeof Veo3GenerateSchema>;
export type SunoGenerateRequest = z.infer<typeof SunoGenerateSchema>;
export type ElevenLabsTTSRequest = z.infer<typeof ElevenLabsTTSSchema>;
export type ElevenLabsSoundEffectsRequest = z.infer<
  typeof ElevenLabsSoundEffectsSchema
>;
export type ByteDanceSeedanceVideoRequest = z.infer<
  typeof ByteDanceSeedanceVideoSchema
>;
export type RunwayAlephVideoRequest = z.infer<typeof RunwayAlephVideoSchema>;
export type WanVideoRequest = z.infer<typeof Wan30VideoSchema>;
export type ByteDanceSeedreamImageRequest = z.infer<
  typeof ByteDanceSeedreamImageSchema
>;
export type OmniHumanVideoRequest = z.infer<typeof OmniHumanVideoSchema>;
export type GeminiOmniRequest = z.infer<typeof GeminiOmniSchema>;
export type QwenImageRequest = z.infer<typeof QwenImageSchema>;
export type MidjourneyGenerateRequest = z.infer<
  typeof MidjourneyGenerateSchema
>;
export type GptImage2Request = z.infer<typeof GptImage2Schema>;

// Flux Kontext Image - Unified text-to-image and image editing
export const FluxKontextImageSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .max(5000)
      .describe(
        "Text prompt describing the desired image or edit (max 5000 characters, English recommended)",
      ),
    enableTranslation: z
      .boolean()
      .default(true)
      .describe("Automatically translate non-English prompts to English"),
    uploadCn: z
      .boolean()
      .default(false)
      .describe(
        "Route uploads via China servers for better performance in Asia",
      ),
    inputImage: z
      .string()
      .url()
      .optional()
      .describe(
        "Input image URL for editing mode (required for image editing, omit for text-to-image generation)",
      ),
    aspectRatio: z
      .enum(["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
      .default("16:9")
      .describe("Output image aspect ratio (default: 16:9)"),
    outputFormat: z
      .enum(["jpeg", "png"])
      .default("jpeg")
      .describe("Output image format"),
    promptUpsampling: z
      .boolean()
      .default(false)
      .describe(
        "Enable prompt enhancement for better results (may increase processing time)",
      ),
    model: z
      .enum(["flux-kontext-pro", "flux-kontext-max"])
      .default("flux-kontext-pro")
      .describe("Model version to use for generation"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
    safetyTolerance: z
      .number()
      .int()
      .min(0)
      .max(6)
      .default(6)
      .describe(
        "Content moderation level (0-6 for generation, 0-2 for editing)",
      ),
    watermark: z
      .string()
      .optional()
      .describe("Watermark identifier to add to the generated image"),
  })
  .refine(
    (data) => {
      // Validate safetyTolerance range based on mode
      const hasInputImage = !!data.inputImage;
      if (hasInputImage && data.safetyTolerance > 2) {
        return false;
      }
      return true;
    },
    {
      message:
        "For image editing mode, safetyTolerance must be between 0 and 2",
      path: ["safetyTolerance"],
    },
  );

export type FluxKontextImageRequest = z.infer<typeof FluxKontextImageSchema>;

// Topaz Image Upscale - AI-powered image enhancement and upscaling
export const TopazUpscaleImageSchema = z.object({
  image_url: z
    .string()
    .url()
    .describe("URL of image to upscale (JPEG, PNG, WEBP, max 10MB)"),
  upscale_factor: z
    .enum(["1", "2", "4", "8"])
    .default("2")
    .describe(
      "Upscale factor: 1x (enhance only), 2x (default), 4x, or 8x. Max output dimension is 20,000px.",
    ),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
    ),
});

export type TopazUpscaleImageRequest = z.infer<typeof TopazUpscaleImageSchema>;

// Recraft Remove Background
export const RecraftRemoveBackgroundSchema = z
  .object({
    image: z
      .string()
      .url()
      .describe(
        "URL of image to remove background from (PNG, JPG, WEBP, max 5MB, 16MP, 4096px max, 256px min)",
      ),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .refine((data) => {
    // Check if callBackUrl is provided directly or via environment variable
    const hasCallBackUrl = data.callBackUrl || process.env.KIE_AI_CALLBACK_URL;
    return true; // callBackUrl is optional for this tool
  });

export type RecraftRemoveBackgroundRequest = z.infer<
  typeof RecraftRemoveBackgroundSchema
>;

// Ideogram V3 Reframe
export const IdeogramReframeSchema = z
  .object({
    image_url: z
      .string()
      .url()
      .describe("URL of image to reframe (JPEG, PNG, WEBP, max 10MB)"),
    image_size: z
      .enum([
        "square",
        "square_hd",
        "portrait_4_3",
        "portrait_16_9",
        "landscape_4_3",
        "landscape_16_9",
      ])
      .default("square_hd")
      .describe("Output size for the reframed image"),
    rendering_speed: z
      .enum(["TURBO", "BALANCED", "QUALITY"])
      .default("BALANCED")
      .optional()
      .describe("Rendering speed for generation"),
    style: z
      .enum(["AUTO", "GENERAL", "REALISTIC", "DESIGN"])
      .default("AUTO")
      .optional()
      .describe("Style type for generation"),
    num_images: z
      .enum(["1", "2", "3", "4"])
      .default("1")
      .optional()
      .describe("Number of images to generate"),
    seed: z
      .number()
      .int()
      .min(0)
      .max(2147483647)
      .default(0)
      .optional()
      .describe("Seed for reproducible results"),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .refine((data) => {
    // Check if callBackUrl is provided directly or via environment variable
    const hasCallBackUrl = data.callBackUrl || process.env.KIE_AI_CALLBACK_URL;
    return true; // callBackUrl is optional for this tool
  });

export type IdeogramReframeRequest = z.infer<typeof IdeogramReframeSchema>;

// Kling 3.0 Video - text-to-video, image-to-video with native audio, multi-shots, and elements
export const KlingVideoSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .max(5000)
      .describe(
        "Text prompt describing the desired video content (max 5000 characters). For audio: use [Character name, voice style] format for dialogue",
      ),
    // Up to 2 images: first = start frame, second = end frame
    image_urls: z
      .array(z.string().url())
      .max(2)
      .optional()
      .describe(
        "Up to 2 image URLs: first = start frame, second = end frame (optional - if not provided, uses text-to-video)",
      ),
    duration: z
      .string()
      .refine(
        (val) => {
          const num = parseInt(val);
          return !isNaN(num) && num >= 3 && num <= 15;
        },
        {
          message: "Duration must be a string number between 3 and 15",
        },
      )
      .default("5")
      .optional()
      .describe("Duration of video in seconds (3-15)"),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1"])
      .default("16:9")
      .optional()
      .describe("Aspect ratio of video (text-to-video mode only)"),
    mode: z
      .enum(["std", "pro"])
      .default("std")
      .optional()
      .describe(
        "Quality mode: 'std' for standard (faster, cheaper), 'pro' for professional quality",
      ),
    sound: z
      .boolean()
      .default(false)
      .optional()
      .describe(
        "Enable native audio generation including multilingual speech, sound effects, and ambient sound. Pricing: with audio is 2x credits",
      ),
    multi_shots: z
      .boolean()
      .default(false)
      .optional()
      .describe(
        "Enable multi-shot mode for cinematic storytelling with multiple scenes (requires multi_prompt)",
      ),
    multi_prompt: z
      .array(
        z.object({
          prompt: z.string(),
          duration: z.number().int().min(1).max(12),
        }),
      )
      .optional()
      .describe(
        "Array of shot definitions for multi-shot mode. Each shot has a prompt and duration (1-12s)",
      ),
    kling_elements: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          element_input_urls: z.array(z.string().url()).optional(),
          element_input_video_urls: z.array(z.string().url()).optional(),
        }),
      )
      .optional()
      .describe(
        "Character/object elements for consistent identity across shots. Provide name, description, and reference images/videos",
      ),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .refine(
    (data) => {
      // multi_shots requires multi_prompt
      if (
        data.multi_shots &&
        (!data.multi_prompt || data.multi_prompt.length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "multi_shots requires multi_prompt array with at least one shot definition",
      path: [],
    },
  );

export type KlingVideoRequest = z.infer<typeof KlingVideoSchema>;

// MiniMax H3 (Hailuo 03) video generation.
export const HailuoVideoSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .describe("Text prompt describing the desired video content"),
    imageUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "First-frame image URL for image-to-video mode. Cannot be combined with reference inputs.",
      ),
    endImageUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional last-frame image URL for image-to-video mode. Requires imageUrl.",
      ),
    referenceImageUrls: z
      .array(z.string().url())
      .min(1)
      .max(9)
      .optional()
      .describe(
        "Reference image URLs for reference-to-video mode (up to 9 images).",
      ),
    referenceVideoUrls: z
      .array(z.string().url())
      .min(1)
      .max(3)
      .optional()
      .describe(
        "Reference video URLs for reference-to-video mode (up to 3 videos).",
      ),
    referenceAudioUrls: z
      .array(z.string().url())
      .min(1)
      .max(3)
      .optional()
      .describe(
        "Reference audio URLs for reference-to-video mode (up to 3 audio files).",
      ),
    duration: z
      .number()
      .int()
      .min(4)
      .max(15)
      .describe("Video duration in seconds (4-15)."),
    aspectRatio: z
      .enum(["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
      .optional()
      .describe(
        "Output aspect ratio. Required for text-to-video; reference-to-video also supports adaptive.",
      ),
    resolution: z
      .enum(["768p"])
      .optional()
      .describe(
        "Reference-to-video output resolution. 768p has a verified rate-card formula.",
      ),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasReferenceInputs = Boolean(
      data.referenceImageUrls?.length ||
        data.referenceVideoUrls?.length ||
        data.referenceAudioUrls?.length,
    );

    if (data.endImageUrl && !data.imageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endImageUrl"],
        message: "endImageUrl requires imageUrl.",
      });
    }

    if (data.imageUrl && hasReferenceInputs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message:
          "imageUrl and reference inputs select different MiniMax H3 modes and cannot be combined.",
      });
    }

    if (data.imageUrl && data.aspectRatio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aspectRatio"],
        message: "aspectRatio is not supported for image-to-video mode.",
      });
    }

    if (data.resolution && !hasReferenceInputs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolution"],
        message:
          "resolution is currently supported only for reference-to-video mode.",
      });
    }

    if (!data.imageUrl && !hasReferenceInputs) {
      if (!data.aspectRatio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aspectRatio"],
          message: "aspectRatio is required for text-to-video mode.",
        });
      } else if (data.aspectRatio === "adaptive") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aspectRatio"],
          message:
            "adaptive aspectRatio is only supported for reference-to-video mode.",
        });
      }
    }
  });

export type HailuoVideoRequest = z.infer<typeof HailuoVideoSchema>;

// Flux-2 Image - Unified text-to-image and image-to-image (Pro/Flex)
export const Flux2ImageSchema = z
  .object({
    prompt: z
      .string()
      .min(3)
      .max(5000)
      .describe("Text prompt describing the desired image (3-5000 characters)"),
    input_urls: z
      .array(z.string().url())
      .min(1)
      .max(8)
      .optional()
      .describe(
        "Reference images for image-to-image mode (1-8 URLs). Omit for text-to-image mode.",
      ),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "auto"])
      .default("1:1")
      .describe(
        "Aspect ratio for the generated image. 'auto' only valid with input_urls.",
      ),
    resolution: z
      .enum(["1K", "2K"])
      .default("1K")
      .describe("Output resolution."),
    model_type: z
      .enum(["pro", "flex"])
      .default("pro")
      .optional()
      .describe(
        "Model variant: 'pro' for fast reliable results, 'flex' for more control and fine-tuning.",
      ),
    callBackUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
      ),
  })
  .refine(
    (data) => {
      // "auto" aspect_ratio only valid with input_urls (image-to-image mode)
      if (data.aspect_ratio === "auto") {
        return data.input_urls && data.input_urls.length > 0;
      }
      return true;
    },
    {
      message:
        "aspect_ratio 'auto' is only valid in image-to-image mode (requires input_urls)",
      path: ["aspect_ratio"],
    },
  );

export type Flux2ImageRequest = z.infer<typeof Flux2ImageSchema>;

// Wan 2.2 Animate - Animation and character replacement
export const WanAnimateSchema = z.object({
  video_url: z
    .string()
    .url()
    .describe(
      "URL of the reference video (MP4, QUICKTIME, X-MATROSKA, max 10MB, max 30 seconds)",
    ),
  image_url: z
    .string()
    .url()
    .describe(
      "URL of the character image (JPEG, PNG, WEBP, max 10MB). Will be resized and center-cropped to match video aspect ratio.",
    ),
  mode: z
    .enum(["animate", "replace"])
    .default("animate")
    .describe(
      "Animation mode: 'animate' transfers motion/expressions from video to image, 'replace' swaps the character in video with the image",
    ),
  resolution: z
    .enum(["480p", "580p", "720p"])
    .default("480p")
    .optional()
    .describe("Output resolution: 480p, 580p, or 720p"),
  callBackUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional: URL for task completion notifications (uses KIE_AI_CALLBACK_URL env var if not provided)",
    ),
});

export type WanAnimateRequest = z.infer<typeof WanAnimateSchema>;

export interface KieAiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

export interface ImageResponse {
  imageUrl?: string;
  taskId?: string;
}

export interface TaskResponse {
  taskId: string;
}

export interface TaskRecord {
  id?: number;
  task_id: string;
  api_type:
    | "nano-banana"
    | "nano-banana-edit"
    | "nano-banana-image"
    | "veo3"
    | "suno"
    | "suno-v6"
    | "wan-image"
    | "elevenlabs-tts"
    | "elevenlabs-sound-effects"
    | "bytedance-seedance-video"
    | "runway-aleph-video"
    | "wan-video"
    | "bytedance-seedream-image"
    | "qwen-image"
    | "midjourney"
    | "gpt-image-2"
    | "flux-kontext-image"
    | "recraft-remove-background"
    | "ideogram-reframe"
    | "kling-3.0-video"
    | "hailuo"
    | "flux2-image"
    | "wan-animate"
    | "z-image"
    | "grok-imagine"
    | "infinitalk"
    | "kling-avatar"
    | "topaz-upscale"
    | "happyhorse-video"
    | "omnihuman-video"
    | "gemini-omni-video"
    | "kling-3.0-omni-video"
    | "kling-4.0-video"
    | "pixverse-video"
    | "vidu-video"
    | "topaz-video-upscale"
    | "gemini-tts"
    | "elevenlabs-dialogue"
    | "flux3-image"
    | "mcp-task";
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  result_url?: string;
  error_message?: string;
  credits_consumed?: number;
}

// Utility tools (task management). Schemas live here so the MCP inputSchema and
// the CLI flags derive from the same definition as every model tool.
export const GetTaskStatusSchema = z.object({
  task_id: z.string().min(1).describe("Task ID to check status for"),
});
export type GetTaskStatusRequest = z.infer<typeof GetTaskStatusSchema>;

export const ListTasksSchema = z.object({
  limit: z
    .number()
    .int()
    .max(100)
    .default(20)
    .describe("Maximum number of tasks to return"),
  status: z
    .enum(["pending", "processing", "completed", "failed"])
    .optional()
    .describe("Filter by status"),
});
export type ListTasksRequest = z.infer<typeof ListTasksSchema>;

// Biome disallows control-character escapes in regex literals, so file-name
// validation is an explicit code-point check instead. It also rejects a
// trailing newline that the previous regex `$` anchor would have accepted.
function isSafeFileName(value: string): boolean {
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (ch === "/" || ch === "\\" || code < 0x20 || code === 0x7f) {
      return false;
    }
  }
  return true;
}

const UploadFileNameSchema = z
  .string()
  .min(1)
  .max(160)
  .refine(
    isSafeFileName,
    "file_name must not contain path separators or control characters",
  );

export const UploadFileSchema = z
  .object({
    file_base64: z
      .string()
      .min(1)
      .max(14_000_000)
      .optional()
      .describe("Base64 media bytes or a data URL (maximum 10 MiB decoded)"),
    file_path: z
      .string()
      .min(1)
      .max(4096)
      .optional()
      .describe(
        "CLI-only local media path. Requires KIE_CLI_UPLOAD_ROOTS and is unavailable to MCP adapters",
      ),
    file_name: UploadFileNameSchema.optional().describe(
      "Optional output filename including extension",
    ),
    content_type: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe("MIME type for raw Base64; data URLs provide it inline"),
  })
  .superRefine((data, ctx) => {
    const sources =
      Number(data.file_path !== undefined) +
      Number(data.file_base64 !== undefined);
    if (sources !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of file_path or file_base64",
        path: [],
      });
    }
    if (data.file_path && data.content_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "content_type is only supported with file_base64",
        path: ["content_type"],
      });
    }
  });

export type UploadFileRequest = z.infer<typeof UploadFileSchema>;

export const GetUploadUrlSchema = z.object({
  app_grant: z.string().min(32).max(200).describe("Short-lived widget grant"),
  filename: UploadFileNameSchema.describe(
    "Original filename shown in download metadata",
  ),
  content_type: z
    .enum([
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/aac",
      "audio/mp4",
    ])
    .describe("Declared media MIME type; bytes are checked after upload"),
  size: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024)
    .describe("Exact upload size in bytes, maximum 25 MiB"),
});

export type GetUploadUrlRequest = z.infer<typeof GetUploadUrlSchema>;

export const FinalizeUploadSchema = z.object({
  app_grant: z.string().min(32).max(200).describe("Short-lived widget grant"),
  media_id: z
    .string()
    .uuid()
    .describe("Opaque media ID returned after browser upload"),
});

export type FinalizeUploadRequest = z.infer<typeof FinalizeUploadSchema>;

export const UploadWidgetSchema = z.object({});
export type UploadWidgetRequest = z.infer<typeof UploadWidgetSchema>;

export const ListModelsSchema = z.object({
  filter: z
    .string()
    .min(1)
    .optional()
    .describe("Optional text or capability filter, for example: lip sync"),
});
export type ListModelsRequest = z.infer<typeof ListModelsSchema>;

export const PrepareMediaGenerationSchema = z.object({
  items: z
    .array(
      z.object({
        tool: z.string().min(1).describe("Registered generation tool name"),
        args: z
          .record(z.string(), z.unknown())
          .describe("Arguments for that tool"),
      }),
    )
    .min(1)
    .max(6)
    .describe("One to six independent generation requests"),
  defaultProfile: z
    .enum(["safe"])
    .optional()
    .describe(
      "Optional explicit safe default policy. The current catalog policy is safe.",
    ),
  maxConcurrency: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .describe("Maximum concurrent task creates for this plan (1-4, default 4)"),
  expiresInSeconds: z
    .number()
    .int()
    .min(60)
    .max(3600)
    .optional()
    .describe("Plan expiry in seconds (60-3600, default 900)"),
});
export type PrepareMediaGenerationRequest = z.infer<
  typeof PrepareMediaGenerationSchema
>;

export const SubmitMediaGenerationSchema = z.object({
  planId: z.string().uuid().describe("Approved plan ID to submit exactly once"),
  approve: z
    .string()
    .uuid()
    .optional()
    .describe(
      "Chat approval fallback for clients without form elicitation: must equal planId. Pass it only after the user saw the full plan with price and said yes in chat for this exact plan.",
    ),
});
export type SubmitMediaGenerationRequest = z.infer<
  typeof SubmitMediaGenerationSchema
>;

export const WaitForTaskSchema = z.object({
  task_id: z
    .string()
    .min(1)
    .describe("Task ID returned by a generation tool to wait for"),
  timeout_seconds: z
    .number()
    .int()
    .min(5)
    .max(600)
    .default(180)
    .describe("Max seconds to wait before giving up"),
  interval_seconds: z
    .number()
    .int()
    .min(1)
    .max(60)
    .default(5)
    .describe("Seconds between status checks while waiting"),
  rendezvous_url: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional callback rendezvous result base URL (e.g. https://felo-workers.felo.workers.dev/kie/result). Omit to poll the Kie API directly (the default). When set, or when KIE_AI_RESULT_URL / a KIE_AI_CALLBACK_URL ending in /kie/callback is configured, it waits on the rendezvous instead",
    ),
});
export type WaitForTaskRequest = z.infer<typeof WaitForTaskSchema>;

export const Veo3Get1080pVideoSchema = z.object({
  task_id: z.string().min(1).describe("Veo3 task ID to get 1080p video for"),
  index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Video index (optional, for multiple video results)"),
});
export type Veo3Get1080pVideoRequest = z.infer<typeof Veo3Get1080pVideoSchema>;

export interface KieAiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  callbackUrlFallback: string;
  fileUploadBaseUrl?: string;
}

// ---------------------------------------------------------------------------
// Fork (oliverhees) models: Kling 3.0 Omni, Kling 4.0, PixVerse V6, Vidu Q4,
// Topaz video upscale, Gemini TTS, ElevenLabs Dialogue v3, FLUX 3 Klein.
// Contracts from docs.kie.ai/market (read 2026-11-04).
// ---------------------------------------------------------------------------

const httpUrl = z.string().regex(/^https?:\/\/.+/, "Must be an http(s) URL");
const mediaUrl = z
  .string()
  .regex(/^(https?|oss):\/\/.+/, "Must be an http(s) or oss URL");

const KlingShotSchema = z.object({
  prompt: z.string().min(1).max(512).describe("Shot prompt (max 512 chars)"),
  duration: z.number().int().min(1).max(12).describe("Shot length in seconds"),
});

const KlingOmniElementSchema = z.object({
  name: z.string().min(1).describe("Unique subject name, referenced as @name"),
  description: z.string().min(1).describe("Short subject description"),
  element_input_urls: z
    .array(mediaUrl)
    .min(1)
    .max(4)
    .describe("2-4 images of the subject, or exactly 1 character video"),
  element_input_audio_urls: z
    .array(mediaUrl)
    .optional()
    .describe("Optional voice audio for the subject"),
  start_time: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Video subject trim start in ms"),
  end_time: z
    .number()
    .int()
    .min(3000)
    .optional()
    .describe("Video subject trim end in ms (span 3000-8000)"),
});

export const KLING_OMNI_MODES = [
  "text-to-video",
  "image-to-video",
  "reference-to-video",
  "transformation",
] as const;

export const KlingOmniVideoSchema = z
  .object({
    mode: z
      .enum(KLING_OMNI_MODES)
      .optional()
      .describe(
        "Optional. Auto: video_urls -> reference-to-video, 1-2 image_urls -> image-to-video (first/last frame), 3+ image_urls or elements -> reference-to-video, else text-to-video. transformation (restyle a video) must be set explicitly",
      ),
    prompt: z
      .string()
      .min(1)
      .max(3072)
      .describe("Video prompt (max 3072 chars). Reference subjects as @name"),
    image_urls: z
      .array(mediaUrl)
      .max(7)
      .optional()
      .describe(
        "image-to-video: 1 (first frame) or 2 (first + last frame). reference-to-video: up to 7 reference images (up to 4 with a video). JPG/PNG, min 300px",
      ),
    video_urls: z
      .array(mediaUrl)
      .length(1)
      .optional()
      .describe(
        "Exactly 1 reference/source video (MP4/MOV, 3-15.5s, max 200MB) for reference-to-video or transformation",
      ),
    duration: z
      .number()
      .int()
      .min(3)
      .max(15)
      .default(5)
      .optional()
      .describe("Duration in seconds (3-15, default 5)"),
    resolution: z
      .enum(["720p", "1080p", "4k"])
      .default("720p")
      .optional()
      .describe("Output resolution (default 720p)"),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1", "auto"])
      .optional()
      .describe(
        "16:9, 9:16, 1:1, or auto (follow the first frame / source video). Default: auto for image-to-video and video input, else 16:9",
      ),
    audio: z
      .boolean()
      .optional()
      .describe(
        "Generate native audio (default false). Always false when a video is provided",
      ),
    customize_multi_shots: z
      .boolean()
      .optional()
      .describe("Use your own shots from multi_prompt"),
    prefer_multi_shots: z
      .boolean()
      .optional()
      .describe("Let Kling split the prompt into shots automatically"),
    multi_prompt: z
      .array(KlingShotSchema)
      .min(1)
      .max(6)
      .optional()
      .describe(
        "Up to 6 shots (prompt + duration); total <= 15s. Needs customize_multi_shots=true",
      ),
    elements: z
      .array(KlingOmniElementSchema)
      .max(7)
      .optional()
      .describe(
        "Subjects (characters, objects) referenced as @name in the prompt",
      ),
    callBackUrl: z.string().url().optional(),
  })
  .refine((d) => !(d.customize_multi_shots && d.prefer_multi_shots), {
    message: "customize_multi_shots and prefer_multi_shots cannot both be true",
    path: ["prefer_multi_shots"],
  })
  .refine((d) => !d.customize_multi_shots || !!d.multi_prompt?.length, {
    message: "customize_multi_shots=true needs multi_prompt",
    path: ["multi_prompt"],
  })
  .refine(
    (d) =>
      !d.multi_prompt ||
      d.multi_prompt.reduce((sum, shot) => sum + shot.duration, 0) <= 15,
    {
      message: "Total multi_prompt duration must be <= 15s",
      path: ["multi_prompt"],
    },
  )
  .refine((d) => d.mode !== "transformation" || !!d.video_urls?.length, {
    message: "transformation needs video_urls",
    path: ["video_urls"],
  })
  .refine(
    (d) =>
      d.mode !== "image-to-video" || [1, 2].includes(d.image_urls?.length ?? 0),
    { message: "image-to-video needs 1 or 2 image_urls", path: ["image_urls"] },
  );
export type KlingOmniVideoRequest = z.infer<typeof KlingOmniVideoSchema>;

export function resolveKlingOmniMode(
  d: Pick<
    KlingOmniVideoRequest,
    "mode" | "image_urls" | "video_urls" | "elements"
  >,
): (typeof KLING_OMNI_MODES)[number] {
  if (d.mode) return d.mode;
  if (d.video_urls?.length) return "reference-to-video";
  const images = d.image_urls?.length ?? 0;
  if (images >= 3 || d.elements?.length) return "reference-to-video";
  if (images > 0) return "image-to-video";
  return "text-to-video";
}

const KLING4_NAME = /^[一-龥A-Za-z0-9_]{1,20}$/;

export const Kling4VideoSchema = z
  .object({
    mode: z
      .enum(["reference-to-video", "keyframe-to-video"])
      .optional()
      .describe(
        "Optional. Auto: first_frame_url / keyframe_urls / last_frame_url -> keyframe-to-video, else reference-to-video (also plain text-to-video)",
      ),
    prompt: z
      .string()
      .min(1)
      .max(8000)
      .describe(
        "Prompt (max 8000 chars). Mentions: @image_1, @video_1, @<element/voice name>; keyframe mode: @first_frame, @keyframe_1, @last_frame",
      ),
    duration: z
      .number()
      .int()
      .min(3)
      .max(30)
      .default(5)
      .optional()
      .describe("Duration in seconds (3-30, default 5)"),
    resolution: z
      .enum(["720p", "1080p"])
      .default("720p")
      .optional()
      .describe("Output resolution (default 720p)"),
    aspect_ratio: z
      .enum(["auto", "16:9", "9:16", "1:1", "21:9"])
      .optional()
      .describe(
        "Aspect ratio. Default: auto with references/frames, else 16:9",
      ),
    image_urls: z
      .array(httpUrl)
      .max(10)
      .optional()
      .describe("reference-to-video: up to 10 reference images (@image_N)"),
    video_urls: z
      .array(httpUrl)
      .max(5)
      .optional()
      .describe(
        "reference-to-video: up to 5 reference videos, 2-30s each (@video_N)",
      ),
    keep_original_sound: z
      .boolean()
      .optional()
      .describe("Keep the reference video's sound (only with video_urls)"),
    elements: z
      .array(
        z.object({
          name: z
            .string()
            .regex(KLING4_NAME)
            .describe("1-20 chars, letters/digits/_"),
          image_urls: z.array(httpUrl).min(2).max(4).optional(),
          video_url: httpUrl
            .optional()
            .describe("3-8s single-shot character video"),
          tag: z
            .enum([
              "character",
              "animal",
              "prop",
              "costume",
              "scene",
              "effect",
              "others",
            ])
            .optional(),
          description: z.string().max(100).optional(),
          voice_url: httpUrl.optional(),
        }),
      )
      .max(7)
      .optional()
      .describe("reference-to-video: up to 7 subjects (max 3 video subjects)"),
    voices: z
      .array(
        z.object({ name: z.string().regex(KLING4_NAME), audio_url: httpUrl }),
      )
      .max(3)
      .optional()
      .describe("reference-to-video: up to 3 named voices (@name)"),
    first_frame_url: httpUrl
      .optional()
      .describe("keyframe-to-video: first frame"),
    keyframe_urls: z
      .array(httpUrl)
      .max(8)
      .optional()
      .describe(
        "keyframe-to-video: middle frames in order (limited by duration)",
      ),
    last_frame_url: httpUrl
      .optional()
      .describe("keyframe-to-video: last frame"),
    callBackUrl: z.string().url().optional(),
  })
  .refine(
    (d) =>
      (d.elements?.length ?? 0) +
        (d.image_urls?.length ?? 0) +
        (d.video_urls?.length ?? 0) +
        (d.voices?.length ?? 0) <=
      15,
    {
      message:
        "elements + image_urls + video_urls + voices must be <= 15 items",
    },
  )
  .refine(
    (d) => (d.elements ?? []).every((e) => !(e.image_urls && e.video_url)),
    {
      message: "An element uses either image_urls or video_url, not both",
      path: ["elements"],
    },
  );
export type Kling4VideoRequest = z.infer<typeof Kling4VideoSchema>;

export function resolveKling4Mode(
  d: Pick<
    Kling4VideoRequest,
    "mode" | "first_frame_url" | "keyframe_urls" | "last_frame_url"
  >,
): "reference-to-video" | "keyframe-to-video" {
  if (d.mode) return d.mode;
  return d.first_frame_url || d.last_frame_url || d.keyframe_urls?.length
    ? "keyframe-to-video"
    : "reference-to-video";
}

export const PixverseVideoSchema = z.object({
  prompt: z.string().min(1).max(5000).describe("Video prompt (max 5000 chars)"),
  image_url: httpUrl
    .optional()
    .describe(
      "Optional start image -> image-to-video (JPG/PNG/WebP, max 20MB). Output follows the image's aspect ratio",
    ),
  aspect_ratio: z
    .enum(["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"])
    .default("16:9")
    .optional()
    .describe("Text-to-video only (default 16:9); ignored with image_url"),
  quality: z
    .enum(["360p", "540p", "720p", "1080p"])
    .default("720p")
    .optional()
    .describe("Output quality (default 720p)"),
  duration: z
    .number()
    .int()
    .min(1)
    .max(15)
    .default(5)
    .optional()
    .describe("Duration in seconds (1-15, default 5)"),
  generate_audio: z
    .boolean()
    .default(false)
    .optional()
    .describe("Generate native synced audio (default false)"),
  seed: z.number().int().min(0).max(2147483647).optional(),
  callBackUrl: z.string().url().optional(),
});
export type PixverseVideoRequest = z.infer<typeof PixverseVideoSchema>;

export const ViduVideoSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .max(20000)
      .optional()
      .describe(
        "Prompt (max 20000 chars). Required for reference-to-video; refer to inputs as 'reference image 2'",
      ),
    image_url: httpUrl
      .optional()
      .describe("Start image -> image-to-video (JPG/PNG/WebP, max 50MB)"),
    reference_image_urls: z
      .array(httpUrl)
      .min(1)
      .max(15)
      .optional()
      .describe("1-15 reference images -> reference-to-video"),
    reference_audio_urls: z
      .array(httpUrl)
      .max(3)
      .optional()
      .describe("reference-to-video: up to 3 MP3 voice clips (3-12s each)"),
    duration: z
      .number()
      .int()
      .min(3)
      .max(16)
      .default(5)
      .optional()
      .describe("Duration in seconds (3-16, default 5)"),
    resolution: z
      .enum(["540p", "720p", "1080p", "2k", "4k"])
      .default("720p")
      .optional()
      .describe("Output resolution (default 720p)"),
    audio: z
      .boolean()
      .default(true)
      .optional()
      .describe("Dialogue and sound effects (default true)"),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1", "4:3", "3:4"])
      .optional()
      .describe("reference-to-video only (default 16:9)"),
    callBackUrl: z.string().url().optional(),
  })
  .refine((d) => !!d.image_url !== !!d.reference_image_urls?.length, {
    message:
      "Provide either image_url (image-to-video) or reference_image_urls (reference-to-video)",
  })
  .refine((d) => !d.reference_image_urls?.length || !!d.prompt, {
    message: "reference-to-video needs a prompt",
    path: ["prompt"],
  });
export type ViduVideoRequest = z.infer<typeof ViduVideoSchema>;

export const TopazUpscaleVideoSchema = z.object({
  video_url: z
    .string()
    .url()
    .describe("Video URL to upscale (MP4, MOV or MKV, max 50MB)"),
  upscale_factor: z
    .enum(["1", "2", "4"])
    .default("2")
    .optional()
    .describe("Upscale factor (default 2). 1 = enhance without enlarging"),
  callBackUrl: z.string().url().optional(),
});
export type TopazUpscaleVideoRequest = z.infer<typeof TopazUpscaleVideoSchema>;

export const GEMINI_TTS_MODELS = [
  "google/gemini-3-8-flash-tts",
  "google/gemini-3-8-flash-lite-tts",
  "google/gemini-3-1-flash-tts",
  "google/gemini-2-5-pro-tts",
] as const;

/** The 30 voices of Gemini 3.1 Flash TTS and 2.5 Pro TTS. 3.8 has 70. */
export const GEMINI_TTS_CLASSIC_VOICES = [
  "Achernar",
  "Achird",
  "Algenib",
  "Algieba",
  "Alnilam",
  "Aoede",
  "Autonoe",
  "Callirrhoe",
  "Charon",
  "Despina",
  "Enceladus",
  "Erinome",
  "Fenrir",
  "Gacrux",
  "Iapetus",
  "Kore",
  "Laomedeia",
  "Leda",
  "Orus",
  "Puck",
  "Pulcherrima",
  "Rasalgethi",
  "Sadachbia",
  "Sadaltager",
  "Schedar",
  "Sulafat",
  "Umbriel",
  "Vindemiatrix",
  "Zephyr",
  "Zubenelgenubi",
] as const;

const GeminiSpeakerSchema = z.object({
  speaker_id: z
    .string()
    .regex(/^Speaker \d+$/, 'Format "Speaker N"')
    .describe('Speaker id, e.g. "Speaker 1"'),
  voice_name: z
    .string()
    .optional()
    .describe(
      "Voice name, e.g. Kore, Puck, Charon, Zephyr, Fola (3.8 only). Default Fola (3.8) / Kore (3.1, 2.5)",
    ),
  replica: z
    .object({
      source_audio_url: z.string().url(),
      consent_audio_url: z.string().url(),
    })
    .optional()
    .describe(
      "3.8 only: temporary voice clone from a 10-30s WAV plus a WAV consent recording. Replaces voice_name",
    ),
  accent: z
    .enum([
      "Neutral",
      "American (Gen)",
      "American (Valley)",
      "American (South)",
      "British (RP)",
      "British (Brixton)",
      "Transatlantic",
      "Australian",
    ])
    .optional()
    .describe("3.1 / 2.5 only (default Neutral)"),
  audio_profile: z
    .string()
    .optional()
    .describe("3.1 / 2.5 only: free-text voice profile"),
  style: z
    .enum([
      "Vocal Smile",
      "Newscaster",
      "Whisper",
      "Empathetic",
      "Promo/Hype",
      "Deadpan",
    ])
    .optional()
    .describe("3.1 / 2.5 only"),
  pace: z
    .enum(["Natural", "Rapid Fire", "The Drift", "Staccato"])
    .optional()
    .describe("3.1 / 2.5 only"),
});

export const GeminiTtsSchema = z
  .object({
    model: z
      .enum(GEMINI_TTS_MODELS)
      .default("google/gemini-3-8-flash-tts")
      .optional()
      .describe(
        "Gemini TTS model (default 3.8 Flash: 70 voices, voice clone, inline tags like <laugh>). 3.1 Flash / 2.5 Pro: 30 voices with accent, style, pace",
      ),
    text: z
      .string()
      .min(1)
      .max(10000)
      .optional()
      .describe(
        "Shortcut for one speaker: the text to speak (instead of dialogue_turns)",
      ),
    voice_name: z
      .string()
      .optional()
      .describe("Shortcut voice for the single speaker"),
    speakers: z
      .array(GeminiSpeakerSchema)
      .min(1)
      .optional()
      .describe("Speakers for multi-speaker dialogue"),
    dialogue_turns: z
      .array(
        z.object({
          speaker_id: z.string().describe('e.g. "Speaker 1"'),
          text: z.string().min(1).max(10000),
          style: z
            .string()
            .optional()
            .describe("3.8 only: free-text delivery style"),
        }),
      )
      .min(1)
      .optional()
      .describe("Ordered dialogue turns"),
    temperature: z
      .number()
      .min(0)
      .max(2)
      .optional()
      .describe("0-2 (default 1)"),
    scene: z.string().optional().describe("3.1 / 2.5 only: scene description"),
    sample_context: z
      .string()
      .optional()
      .describe("3.1 / 2.5 only: overall tone"),
    filler_words: z
      .boolean()
      .optional()
      .describe("3.8 only, two speakers: add natural filler words"),
    callBackUrl: z.string().url().optional(),
  })
  .refine((d) => !!d.text || !!d.dialogue_turns?.length, {
    message: "Provide text (single speaker) or dialogue_turns",
  })
  .refine((d) => !d.dialogue_turns?.length || !!d.speakers?.length, {
    message: "dialogue_turns needs speakers",
    path: ["speakers"],
  });
export type GeminiTtsRequest = z.infer<typeof GeminiTtsSchema>;

export const ElevenLabsDialogueSchema = z.object({
  dialogue: z
    .array(
      z.object({
        text: z
          .string()
          .min(1)
          .describe(
            "Line to speak. v3 audio tags like [laughs] or [whispers] work",
          ),
        voice: z
          .string()
          .default("EkK5I93UQWFDigLMpZcX")
          .optional()
          .describe(
            "ElevenLabs voice ID (default EkK5I93UQWFDigLMpZcX = James). E.g. FGY2WhTYpPnrIDTdsKH5 Laura, TX3LPaxmHKxFdv7VOQHJ Liam, BZgkqPqms7Kj9ulSkVzn Eve, nPczCjzI2devNBz1zQrb Brian, hpp4J3VqNfWAUOO0d1Us Bella",
          ),
      }),
    )
    .min(1)
    .describe("Dialogue lines in order; total text max 5000 characters")
    .refine((lines) => lines.reduce((n, l) => n + l.text.length, 0) <= 5000, {
      message: "Total dialogue text must be <= 5000 characters",
    }),
  stability: z
    .union([z.literal(0), z.literal(0.5), z.literal(1)])
    .default(0.5)
    .optional()
    .describe("0 creative, 0.5 natural (default), 1 robust"),
  language_code: z
    .string()
    .regex(/^[a-z]{2,3}$/)
    .optional()
    .describe("ISO language code, e.g. de, en. Omit for auto-detect"),
  callBackUrl: z.string().url().optional(),
});
export type ElevenLabsDialogueRequest = z.infer<
  typeof ElevenLabsDialogueSchema
>;

export const Flux3KleinImageSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .max(5000)
      .describe("Prompt or edit instruction (max 5000 chars)"),
    image_urls: z
      .array(httpUrl)
      .min(1)
      .max(10)
      .optional()
      .describe("1-10 input images -> edit mode (JPG/PNG/WebP, max 30MB)"),
    aspect_ratio: z
      .enum([
        "1:1",
        "4:3",
        "3:4",
        "3:2",
        "2:3",
        "16:9",
        "9:16",
        "21:9",
        "9:21",
        "auto",
      ])
      .optional()
      .describe("Default 1:1 (generate) / auto = first input image (edit)"),
    resolution: z
      .enum(["1K", "2K", "4K"])
      .default("1K")
      .optional()
      .describe("1K (1.6 credits), 2K (2.5), 4K (6.5) per image"),
    width: z
      .number()
      .int()
      .min(256)
      .max(4096)
      .optional()
      .describe("Custom width; needs height"),
    height: z
      .number()
      .int()
      .min(256)
      .max(4096)
      .optional()
      .describe("Custom height; needs width"),
    output_format: z.enum(["png", "jpeg", "webp"]).default("png").optional(),
    num_images: z
      .number()
      .int()
      .min(1)
      .max(4)
      .default(1)
      .optional()
      .describe("1-4 images"),
    seed: z.number().int().min(0).max(2147483647).optional(),
    enhance_prompt: z
      .boolean()
      .optional()
      .describe("Let FLUX rewrite the prompt (default true)"),
    nsfw_checker: z
      .boolean()
      .optional()
      .describe("Extra NSFW filtering (default false)"),
    callBackUrl: z.string().url().optional(),
  })
  .refine((d) => (d.width === undefined) === (d.height === undefined), {
    message: "width and height must be set together",
    path: ["width"],
  })
  .refine((d) => d.aspect_ratio !== "auto" || !!d.image_urls?.length, {
    message: "aspect_ratio auto needs image_urls",
    path: ["aspect_ratio"],
  })
  .refine(
    (d) => {
      if (d.width === undefined || d.height === undefined) return true;
      const ratio = d.width / d.height;
      return ratio >= 0.4 && ratio <= 2.5;
    },
    {
      message: "width/height ratio must be between 1:2.5 and 2.5:1",
      path: ["width"],
    },
  );
export type Flux3KleinImageRequest = z.infer<typeof Flux3KleinImageSchema>;
