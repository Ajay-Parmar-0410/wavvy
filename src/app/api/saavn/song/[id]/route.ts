import { NextRequest, NextResponse } from "next/server";
import { getSongById } from "@/lib/saavn";

export const preferredRegion = "bom1";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const song = await getSongById(params.id);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: song });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch song";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
