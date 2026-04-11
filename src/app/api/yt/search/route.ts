import { NextRequest, NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    const songs = await searchYouTube(q);
    return NextResponse.json({ success: true, data: { songs } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "YouTube search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
