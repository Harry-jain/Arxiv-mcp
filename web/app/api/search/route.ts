import { NextRequest, NextResponse } from "next/server";
import { callTool } from "@/lib/mcpClient";

export async function POST(request: NextRequest) {
  const { query, maxResults } = await request.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const papers = await callTool("search_papers", {
      query,
      max_results: maxResults ?? 5,
    });
    return NextResponse.json({ papers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
