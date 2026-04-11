import { NextRequest, NextResponse } from "next/server";
import { searchSaavn, searchSongs } from "@/lib/saavn";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type"); // "songs" for songs-only
  const page = request.nextUrl.searchParams.get("p") || "1";

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    if (type === "songs") {
      const songs = await searchSongs(q, parseInt(page, 10));
      return NextResponse.json({ success: true, data: { songs } });
    }

    const results = await searchSaavn(q);
    return NextResponse.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
