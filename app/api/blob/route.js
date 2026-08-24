import { randomUUID } from "crypto";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export async function POST() {
  if (!KV_URL || !KV_TOKEN) {
    return Response.json({ error: "kv_not_configured" }, { status: 500 });
  }

  const id = randomUUID();
  const initial = { updatedAt: Date.now(), itemBank: [], trips: [] };

  let res;
  try {
    res = await fetch(`${KV_URL}/set/list:${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: JSON.stringify(initial),
    });
  } catch (err) {
    return Response.json({ error: "network" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json({ error: "create_failed" }, { status: 502 });
  }

  return Response.json({ id, data: initial });
}
