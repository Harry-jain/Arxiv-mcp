import { NextRequest, NextResponse } from "next/server";
import { callTool } from "@/lib/mcpClient";

export async function GET() {
  try {
    const papers = await callTool("get_reading_list", {});
    return NextResponse.json({ papers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { id, title, note } = await request.json();

  if (!id || !title) {
    return NextResponse.json({ error: "id and title are required" }, { status: 400 });
  }

  try {
    const message = await callTool("add_to_reading_list", {
      paper_id: id,
      title,
      note: note ?? "",
    });
    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
