let voiceId = "21m00Tcm4TlvDq8ikWAM";

export async function generateSpeech(text, language = "en") {
  if (!process.env.ELEVENLABS_API_KEY) {
    return { audio: null, error: "ElevenLabs not configured" };
  }
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    if (!response.ok) {
      return { audio: null, error: `ElevenLabs error: ${response.statusText}` };
    }
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return { audio: audioBuffer, error: null };
  } catch (error) {
    return { audio: null, error: error.message };
  }
}
