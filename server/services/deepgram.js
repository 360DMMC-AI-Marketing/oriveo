import { createClient } from "@deepgram/sdk";

let deepgram = null;

export function getDeepgram() {
  if (!deepgram && process.env.DEEPGRAM_API_KEY) {
    deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }
  return deepgram;
}

export async function transcribeAudio(audioBuffer, language = "en") {
  const client = getDeepgram();
  if (!client) {
    return { text: "", error: "Deepgram not configured" };
  }
  try {
    const options = {
      model: "nova-2",
      smart_format: true,
    };
    if (language && language !== "multi") {
      options.language = language;
    } else {
      options.model = "nova-3";
      options.language = "multi";
    }
    const { result } = await client.listen.prerecorded.transcribeFile(audioBuffer, options);
    const text = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    return { text, error: null };
  } catch (error) {
    return { text: "", error: error.message };
  }
}

export function createLiveTranscription(options = {}) {
  const client = getDeepgram();
  if (!client) {
    return null;
  }

  const {
    language = "en",
    model = "nova-2",
    encoding = "mulaw",
    sampleRate = 8000,
    channels = 1,
    smartFormat = true,
    punctuate = true,
    interimResults = false,
    endpointing = 500,
    utteranceEndMs = 1000,
    vadEvents = true,
  } = options;

  let liveModel = model;
  let liveLanguage = language;

  if (language === "flux-general-multi") {
    liveModel = "flux-general-multi";
    liveLanguage = undefined;
  }

  const liveOptions = {
    model: liveModel,
    encoding,
    sample_rate: sampleRate,
    channels,
    smart_format: smartFormat,
    punctuate,
    interim_results: interimResults,
    endpointing,
    utterance_end_ms: utteranceEndMs,
    vad_events: vadEvents,
    no_delay: true,
  };

  if (liveLanguage) {
    liveOptions.language = liveLanguage;
  }

  return client.listen.live(liveOptions);
}
