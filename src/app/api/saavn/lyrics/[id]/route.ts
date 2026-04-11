import { NextRequest, NextResponse } from "next/server";
import { getLyrics } from "@/lib/saavn";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lyrics = await getLyrics(params.id);
    if (!lyrics) {
      return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { lyrics } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch lyrics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
