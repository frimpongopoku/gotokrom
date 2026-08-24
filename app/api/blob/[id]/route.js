const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export async function GET(_req, { params }) {
  if (!KV_URL || !KV_TOKEN) {
    return Response.json({ error: "kv_not_configured" }, { status: 500 });
  }

  let res;
  try {
    res = await fetch(`${KV_URL}/get/list:${params.id}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: "no-store",
    });
  } catch (err) {
    return Response.json({ error: "network" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json({ error: "not_found" }, { status: res.status });
  }

  const { result } = await res.json();
  if (result == null) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const data = typeof result === "string" ? JSON.parse(result) : result;
  return Response.json(data);
}

export async function PUT(req, { params }) {
  if (!KV_URL || !KV_TOKEN) {
    return Response.json({ error: "kv_not_configured" }, { status: 500 });
  }

  const body = await req.json();

  let res;
  try {
    res = await fetch(`${KV_URL}/set/list:${params.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return Response.json({ error: "network" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json({ error: "save_failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
