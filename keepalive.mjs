// Runs daily. For each Supabase project: delete yesterday's row, insert a new one.
// Add projects by adding env vars SUPABASE_URL_n / SUPABASE_KEY_n (n = 1..20). No code edits needed.

const MAX_PROJECTS = 20;
const TABLE = "keepalive";

export default async () => {
  for (let i = 1; i <= MAX_PROJECTS; i++) {
    const url = process.env[`SUPABASE_URL_${i}`];
    const key = process.env[`SUPABASE_KEY_${i}`];
    if (!url || !key) continue;

    const base = `${url.replace(/\/$/, "")}/rest/v1/${TABLE}`;
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };

    try {
      // 1. remove previous data
      const del = await fetch(`${base}?id=gt.0`, { method: "DELETE", headers });

      // 2. insert today's row
      const ins = await fetch(base, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ note: `ping ${new Date().toISOString()}` }),
      });

      console.log(`project ${i}: delete=${del.status} insert=${ins.status}`);
    } catch (err) {
      console.log(`project ${i}: FAILED - ${err.message}`);
    }
  }
};

export const config = {
  schedule: "0 9 * * *", // daily, 09:00 UTC
};
