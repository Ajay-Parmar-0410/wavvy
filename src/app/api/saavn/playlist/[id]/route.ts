import { NextRequest, NextResponse } from "next/server";
import { getPlaylistById } from "@/lib/saavn";

export const preferredRegion = "bom1";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const page = request.nextUrl.searchParams.get("p") || "1";
  const limit = request.nextUrl.searchParams.get("n") || "50";

  try {
    const playlist = await getPlaylistById(params.id, parseInt(page, 10), parseInt(limit, 10));
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: playlist });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch playlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
