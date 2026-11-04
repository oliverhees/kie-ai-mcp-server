import { ElevenLabsDialogueSchema } from "../types.js";
import { marketTool, pick } from "./market-tool.js";

export const elevenlabsDialogueTool = marketTool({
  name: "elevenlabs_dialogue",
  description:
    "Multi-voice dialogue with ElevenLabs v3 (text-to-dialogue): several lines with different voices, audio tags like [laughs], 70+ languages, up to 5000 characters.",
  category: "audio",
  schema: ElevenLabsDialogueSchema,
  apiType: "elevenlabs-dialogue",
  build(r) {
    const dialogue = r.dialogue.map((line) => ({
      text: line.text,
      voice: line.voice ?? "EkK5I93UQWFDigLMpZcX",
    }));
    return {
      model: "elevenlabs/text-to-dialogue-v3",
      input: {
        dialogue,
        stability: r.stability ?? 0.5,
        ...pick(r, ["language_code"]),
      },
      label: "ElevenLabs Dialogue v3",
      parameters: { lines: dialogue.length },
    };
  },
  hints: {
    dialogue: "Required: [{text, voice}] lines; total max 5000 characters",
    stability: "Optional: 0, 0.5 (default) or 1",
  },
});
