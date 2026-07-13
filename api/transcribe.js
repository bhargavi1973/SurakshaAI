// Vercel serverless function -- transcribes audio using Groq's free, fast
// Whisper API (whisper-large-v3-turbo). This is intentionally Groq-specific
// (not routed through the multi-provider /api/llm) since Gemini/Azure would
// need different request shapes for audio, and Groq's Whisper tier is free
// and fast enough that there's no reason to abstract it further for a
// hackathon prototype.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: "Voice transcription requires GROQ_API_KEY to be configured on the server (Groq provides free Whisper transcription, separate from whichever provider is used for text/image classification)."
    });
  }

  const { audioBase64, mimeType } = req.body || {};
  if (!audioBase64) {
    return res.status(400).json({ error: "No audio data provided" });
  }

  try {
    const buffer = Buffer.from(audioBase64, "base64");
    const ext = (mimeType || "").includes("mp3") ? "mp3"
      : (mimeType || "").includes("wav") ? "wav"
      : (mimeType || "").includes("ogg") ? "ogg"
      : "webm";
    const blob = new Blob([buffer], { type: mimeType || "audio/webm" });

    const form = new FormData();
    form.append("file", blob, "recording." + ext);
    form.append("model", process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo");
    form.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: form
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ? data.error.message : "Transcription failed");
    }

    return res.status(200).json({ text: data.text || "" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
