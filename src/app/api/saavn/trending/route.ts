import { NextResponse } from "next/server";
import { getTrending } from "@/lib/saavn";

export async function GET() {
  try {
    const data = await getTrending();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch trending";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
