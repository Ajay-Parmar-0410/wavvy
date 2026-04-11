import { NextRequest, NextResponse } from "next/server";
import { getAlbumById } from "@/lib/saavn";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const album = await getAlbumById(params.id);
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: album });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch album";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
