import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { channel, data } = await req.json();
  // forward to the WS server's internal broadcast endpoint
  try {
    await fetch(`http://localhost:3001/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, data }),
    });
  } catch {}
  return NextResponse.json({ ok: true });
}
