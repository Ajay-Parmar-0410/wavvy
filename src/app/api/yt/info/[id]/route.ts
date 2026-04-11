import { NextRequest, NextResponse } from "next/server";
import { getYouTubeVideoInfo } from "@/lib/youtube";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const song = await getYouTubeVideoInfo(params.id);
    if (!song) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: song });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get video info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
