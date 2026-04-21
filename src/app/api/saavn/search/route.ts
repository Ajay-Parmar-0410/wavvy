import { NextRequest, NextResponse } from "next/server";
import { searchAll, searchSaavn, searchSongs } from "@/lib/saavn";

// Run on Mumbai edge so Saavn sees an Indian caller IP and ranks results
// against the India catalog (otherwise Vercel's default IAD region gets
// a US-biased ranking, e.g. "Ramta Jogi" returns a Punjabi Club Mix
// instead of Sukhwinder Singh's 1999 Taal original).
export const preferredRegion = "bom1";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type");
  const page = request.nextUrl.searchParams.get("p") || "1";

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    if (type === "songs") {
      const songs = await searchSongs(q, parseInt(page, 10));
      return NextResponse.json({ success: true, data: { songs } });
    }

    if (type === "autocomplete") {
      const results = await searchSaavn(q);
      return NextResponse.json({ success: true, data: results });
    }

    const results = await searchAll(q);
    return NextResponse.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
