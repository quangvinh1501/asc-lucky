import Pusher from "pusher";
import { NextRequest, NextResponse } from "next/server";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  const { channel, event, data } = await req.json();
  await pusher.trigger(`lucky-${channel}`, event, data);
  return NextResponse.json({ ok: true });
}
