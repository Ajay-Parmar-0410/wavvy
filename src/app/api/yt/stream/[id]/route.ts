import { NextRequest, NextResponse } from "next/server";
import { getYouTubeStreamUrl } from "@/lib/youtube";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getYouTubeStreamUrl(params.id);
    if (!data) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
