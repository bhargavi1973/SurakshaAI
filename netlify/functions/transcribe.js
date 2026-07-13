// Netlify function -- same behaviour as api/transcribe.js (Vercel version).
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Voice transcription requires GROQ_API_KEY to be configured on the server (Groq provides free Whisper transcription, separate from whichever provider is used for text/image classification)."
      })
    };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { /* ignore */ }
  const { audioBase64, mimeType } = payload;
  if (!audioBase64) {
    return { statusCode: 400, body: JSON.stringify({ error: "No audio data provided" }) };
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

    return { statusCode: 200, body: JSON.stringify({ text: data.text || "" }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
