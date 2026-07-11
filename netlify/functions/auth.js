// Netlify function -- same behaviour as api/auth.js (Vercel version).
// See that file for the important caveat about this being a demo-grade
// access gate, not production authentication.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const expected = process.env.OFFICIAL_ACCESS_CODE;
  if (!expected) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: "OFFICIAL_ACCESS_CODE is not configured on the server." }) };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { /* ignore */ }

  const ok = typeof payload.code === "string" && payload.code === expected;

  return { statusCode: 200, body: JSON.stringify({ ok }) };
};
