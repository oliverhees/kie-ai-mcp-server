import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { TaskDatabase } from "../database.js";
import { prepareGenerationPlan } from "../generation-plan.js";
import { KieAiClient } from "../kie-ai-client.js";
import { getTool, TOOL_REGISTRY } from "../tools/index.js";
import type { ToolContext } from "../tools/types.js";

// Fork (oliverhees) models. Request shapes follow docs.kie.ai/market (2026-11-04).

const image = "https://example.com/image.png";
const image2 = "https://example.com/image2.png";
const video = "https://example.com/video.mp4";
const callback = "https://example.com/callback";
const prompt = "A samurai walks through neon rain";
let directory: string;
let ctx: ToolContext;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "kie-fork-models-"));
  ctx = {
    db: new TaskDatabase(join(directory, "tasks.db")),
    client: new KieAiClient({
      apiKey: "test-key",
      baseUrl: "https://provider.example/api/v1",
      timeout: 1000,
      callbackUrlFallback: callback,
    }),
    approvalContext: "test",
    getTool,
    getCallbackUrl: (url) => url ?? callback,
    formatError: (_name, error) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: false, error: String(error) }),
        },
      ],
      isError: true,
    }),
  };
});

afterEach(() => {
  jest.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

interface Route {
  tool: string;
  args: Record<string, unknown>;
  model: string;
  apiType: string;
  input: Record<string, unknown>;
  absent?: string[];
}

const routes: Route[] = [
  {
    tool: "kling_omni_video",
    args: { prompt },
    model: "kling-3.0-omni/text-to-video",
    apiType: "kling-3.0-omni-video",
    input: {
      prompt,
      duration: 5,
      audio: false,
      aspect_ratio: "16:9",
      resolution: "720p",
    },
  },
  {
    tool: "kling_omni_video",
    args: { prompt, image_urls: [image, image2], audio: true },
    model: "kling-3.0-omni/image-to-video",
    apiType: "kling-3.0-omni-video",
    input: { image_urls: [image, image2], aspect_ratio: "auto", audio: true },
  },
  {
    tool: "kling_omni_video",
    args: { prompt, video_urls: [video], audio: true, aspect_ratio: "16:9" },
    model: "kling-3.0-omni/reference-to-video",
    apiType: "kling-3.0-omni-video",
    input: { video_urls: [video], aspect_ratio: "auto", audio: false },
    absent: ["duration"],
  },
  {
    tool: "kling_omni_video",
    args: {
      prompt: "@hero fights in the rain",
      elements: [
        {
          name: "hero",
          description: "the user",
          element_input_urls: [image, image2],
        },
      ],
    },
    model: "kling-3.0-omni/reference-to-video",
    apiType: "kling-3.0-omni-video",
    input: { aspect_ratio: "16:9", duration: 5 },
  },
  {
    tool: "kling_omni_video",
    args: { prompt, mode: "transformation", video_urls: [video] },
    model: "kling-3.0-omni/transformation",
    apiType: "kling-3.0-omni-video",
    input: { video_urls: [video], aspect_ratio: "auto", audio: false },
    absent: ["duration"],
  },
  {
    tool: "kling_4_video",
    args: { prompt: "@image_1 dances", image_urls: [image], duration: 20 },
    model: "kling-4.0/reference-to-video",
    apiType: "kling-4.0-video",
    input: { image_urls: [image], duration: 20, resolution: "720p" },
  },
  {
    tool: "kling_4_video",
    args: { prompt, first_frame_url: image, last_frame_url: image2 },
    model: "kling-4.0/keyframe-to-video",
    apiType: "kling-4.0-video",
    input: { first_frame_url: image, last_frame_url: image2 },
    absent: ["image_urls"],
  },
  {
    tool: "pixverse_video",
    args: { prompt },
    model: "pixverse-v6-max/text-to-video",
    apiType: "pixverse-video",
    input: {
      prompt,
      aspect_ratio: "16:9",
      quality: "720p",
      duration: 5,
      generate_audio_switch: false,
    },
  },
  {
    tool: "pixverse_video",
    args: { prompt, image_url: image, generate_audio: true },
    model: "pixverse-v6-max/image-to-video",
    apiType: "pixverse-video",
    input: { image_urls: [image], generate_audio_switch: true },
    absent: ["aspect_ratio"],
  },
  {
    tool: "vidu_video",
    args: { image_url: image },
    model: "vidu-q4/image-to-video",
    apiType: "vidu-video",
    input: { image_url: image, duration: 5, resolution: "720p", audio: true },
    absent: ["aspect_ratio"],
  },
  {
    tool: "vidu_video",
    args: { prompt, reference_image_urls: [image, image2] },
    model: "vidu-q4/reference-to-video",
    apiType: "vidu-video",
    input: { prompt, reference_image_urls: [image, image2] },
  },
  {
    tool: "topaz_upscale_video",
    args: { video_url: video },
    model: "topaz/video-upscale",
    apiType: "topaz-video-upscale",
    input: { video_url: video, upscale_factor: "2" },
  },
  {
    tool: "gemini_tts",
    args: { text: "Hallo Aiianer <laugh>" },
    model: "google/gemini-3-8-flash-tts",
    apiType: "gemini-tts",
    input: {
      speakers: [{ speaker_id: "Speaker 1", voice_name: "Fola" }],
      dialogue_turns: [
        { speaker_id: "Speaker 1", text: "Hallo Aiianer <laugh>" },
      ],
    },
  },
  {
    tool: "gemini_tts",
    args: {
      model: "google/gemini-2-5-pro-tts",
      speakers: [
        { speaker_id: "Speaker 1", voice_name: "Puck" },
        { speaker_id: "Speaker 2", voice_name: "Kore", style: "Newscaster" },
      ],
      dialogue_turns: [
        { speaker_id: "Speaker 1", text: "Hi", style: "ignored on 2.5" },
        { speaker_id: "Speaker 2", text: "Hello" },
      ],
      scene: "studio",
    },
    model: "google/gemini-2-5-pro-tts",
    apiType: "gemini-tts",
    input: {
      speakers: [
        { speaker_id: "Speaker 1", voice_name: "Puck", accent: "Neutral" },
        {
          speaker_id: "Speaker 2",
          voice_name: "Kore",
          accent: "Neutral",
          style: "Newscaster",
        },
      ],
      dialogue_turns: [
        { speaker_id: "Speaker 1", text: "Hi" },
        { speaker_id: "Speaker 2", text: "Hello" },
      ],
      scene: "studio",
    },
  },
  {
    tool: "elevenlabs_dialogue",
    args: {
      dialogue: [
        { text: "[laughs] Na?" },
        { text: "Alles gut.", voice: "FGY2WhTYpPnrIDTdsKH5" },
      ],
      language_code: "de",
    },
    model: "elevenlabs/text-to-dialogue-v3",
    apiType: "elevenlabs-dialogue",
    input: {
      dialogue: [
        { text: "[laughs] Na?", voice: "EkK5I93UQWFDigLMpZcX" },
        { text: "Alles gut.", voice: "FGY2WhTYpPnrIDTdsKH5" },
      ],
      stability: 0.5,
      language_code: "de",
    },
  },
  {
    tool: "flux3_klein_image",
    args: { prompt, num_images: 2 },
    model: "flux-3/klein-text-to-image",
    apiType: "flux3-image",
    input: { prompt, num_images: 2, resolution: "1K" },
  },
  {
    tool: "flux3_klein_image",
    args: { prompt, image_urls: [image], aspect_ratio: "auto" },
    model: "flux-3/klein-edit-image",
    apiType: "flux3-image",
    input: { prompt, image_urls: [image], aspect_ratio: "auto" },
  },
  {
    tool: "nano_banana_image",
    args: { model: "nano-banana-pro", prompt, image_input: [image] },
    model: "nano-banana-pro",
    apiType: "nano-banana-edit",
    input: { prompt, image_input: [image], resolution: "1K" },
    absent: ["image_urls", "google_search"],
  },
  {
    tool: "nano_banana_image",
    args: { model: "nano-banana-2-1", prompt, aspect_ratio: "1:8" },
    model: "nano-banana-2-1",
    apiType: "nano-banana-image",
    input: { prompt, image_input: [], aspect_ratio: "1:8" },
  },
];

test.each(routes)(
  "$tool -> $model",
  async ({ tool, args, model, apiType, input, absent }) => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({ code: 200, data: { taskId: "task-1" } }),
          ),
      );
    const result = await getTool(tool)!.run(args, ctx);
    expect(JSON.parse(result.content[0].text)).toMatchObject({
      success: true,
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://provider.example/api/v1/jobs/createTask",
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.model).toBe(model);
    expect(body.input).toMatchObject(input);
    for (const key of absent ?? []) expect(body.input).not.toHaveProperty(key);
    expect(body.callBackUrl).toBe(callback);

    const task = await ctx.db.getTask("task-1");
    expect(task).toMatchObject({ api_type: apiType, status: "pending" });
    await ctx.client.getTaskStatus("task-1", task!.api_type);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "/jobs/recordInfo?taskId=task-1",
    );

    const plan = prepareGenerationPlan(
      [{ tool, args }],
      new Map(TOOL_REGISTRY.map((item) => [item.name, item])),
    );
    expect(plan.items[0].model).toBe(model);
  },
);

test.each([
  ["kling_omni_video", { prompt, mode: "image-to-video" }],
  [
    "kling_omni_video",
    { prompt, customize_multi_shots: true, prefer_multi_shots: true },
  ],
  [
    "kling_omni_video",
    {
      prompt,
      customize_multi_shots: true,
      multi_prompt: [
        { prompt: "a", duration: 10 },
        { prompt: "b", duration: 10 },
      ],
    },
  ],
  ["vidu_video", { prompt }],
  ["vidu_video", { reference_image_urls: [image] }],
  ["flux3_klein_image", { prompt, width: 1024 }],
  ["flux3_klein_image", { prompt, aspect_ratio: "auto" }],
  [
    "gemini_tts",
    { model: "google/gemini-3-1-flash-tts", text: "x", voice_name: "Fola" },
  ],
  ["gemini_tts", {}],
  ["elevenlabs_dialogue", { dialogue: [{ text: "x".repeat(5001) }] }],
  [
    "nano_banana_image",
    { model: "nano-banana-pro", prompt, aspect_ratio: "1:8" },
  ],
  [
    "nano_banana_image",
    {
      model: "nano-banana-pro",
      prompt,
      image_input: Array.from({ length: 9 }, () => image),
    },
  ],
])("%s rejects invalid input (case %#)", async (tool, args) => {
  const fetchMock = jest.spyOn(globalThis, "fetch");
  const result = await getTool(tool)!.run(args, ctx);
  expect(JSON.parse(result.content[0].text).success).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});
