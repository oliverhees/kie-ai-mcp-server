import { GEMINI_TTS_CLASSIC_VOICES, GeminiTtsSchema } from "../types.js";
import { marketTool, pick } from "./market-tool.js";

const CLASSIC = new Set<string>(GEMINI_TTS_CLASSIC_VOICES);

export const geminiTtsTool = marketTool({
  name: "gemini_tts",
  description:
    "Text-to-speech and multi-speaker dialogue with Google Gemini TTS (3.8 Flash, 3.8 Flash Lite, 3.1 Flash, 2.5 Pro). 30-70 voices, inline emotion tags, voice clone (3.8). Output WAV. Use text + voice_name for one speaker.",
  category: "audio",
  schema: GeminiTtsSchema,
  apiType: "gemini-tts",
  build(r) {
    const model = r.model ?? "google/gemini-3-8-flash-tts";
    const isClassic =
      model === "google/gemini-3-1-flash-tts" ||
      model === "google/gemini-2-5-pro-tts";
    const defaultVoice = isClassic ? "Kore" : "Fola";

    const speakers = r.speakers?.length
      ? r.speakers
      : [{ speaker_id: "Speaker 1", voice_name: r.voice_name }];
    const turns = r.dialogue_turns?.length
      ? r.dialogue_turns
      : [{ speaker_id: speakers[0].speaker_id, text: r.text as string }];

    const mappedSpeakers = speakers.map((s) => {
      if (isClassic) {
        const voice = s.voice_name ?? defaultVoice;
        if (!CLASSIC.has(voice)) {
          throw new Error(
            `Voice "${voice}" is not available on ${model}. Use one of: ${GEMINI_TTS_CLASSIC_VOICES.join(", ")}`,
          );
        }
        return {
          ...pick(s, ["speaker_id", "audio_profile", "style", "pace"]),
          voice_name: voice,
          accent: s.accent ?? "Neutral",
        };
      }
      return s.replica
        ? { speaker_id: s.speaker_id, replica: s.replica }
        : {
            speaker_id: s.speaker_id,
            voice_name: s.voice_name ?? defaultVoice,
          };
    });

    const input: Record<string, unknown> = {
      speakers: mappedSpeakers,
      dialogue_turns: isClassic
        ? turns.map((t) => ({ speaker_id: t.speaker_id, text: t.text }))
        : turns,
      ...pick(r, ["temperature"]),
      ...(isClassic
        ? pick(r, ["scene", "sample_context"])
        : pick(r, ["filler_words"])),
    };
    return {
      model,
      input,
      label: "Gemini TTS",
      parameters: { speakers: mappedSpeakers.length, turns: turns.length },
    };
  },
  hints: {
    text: "Single speaker: text (+ optional voice_name)",
    dialogue_turns:
      'Multi-speaker: speakers [{speaker_id: "Speaker 1", voice_name}] + dialogue_turns [{speaker_id, text}]',
    model:
      "Optional: google/gemini-3-8-flash-tts (default), -3-8-flash-lite-tts, -3-1-flash-tts, -2-5-pro-tts",
  },
});
