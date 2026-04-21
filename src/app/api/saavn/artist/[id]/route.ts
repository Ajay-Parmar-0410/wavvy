import { NextRequest, NextResponse } from "next/server";
import { getArtistById } from "@/lib/saavn";

export const preferredRegion = "bom1";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getArtistById(params.id);
    if (!data) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch artist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
