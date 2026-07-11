// Vercel serverless function -- validates the "Cyber Official" access code
// against a secret stored server-side (OFFICIAL_ACCESS_CODE env var).
//
// IMPORTANT: this is a simple demo access gate for a hackathon prototype,
// NOT production-grade authentication. It has no per-user accounts, no
// audit trail of who logged in, and no session expiry beyond the browser
// tab (sessionStorage). A real deployment for actual law-enforcement use
// would need proper identity verification (e.g. government SSO / Aadhaar
// e-KYC for officials) and role-based access control on the backend, not
// just a shared password gating a client-side UI toggle.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.OFFICIAL_ACCESS_CODE;
  if (!expected) {
    return res.status(500).json({ ok: false, error: "OFFICIAL_ACCESS_CODE is not configured on the server." });
  }

  const { code } = req.body || {};
  const ok = typeof code === "string" && code === expected;

  return res.status(200).json({ ok });
};
