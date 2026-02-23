// app/api/upload/route.ts
//
// ⚠️  THE VERCEL PROBLEM EXPLAINED:
// Vercel serverless functions have a 4.5MB request body limit and 60s timeout.
// Piping a video file THROUGH your API route will hit both limits instantly.
//
// THE FIX: This route no longer receives the file itself.
// Instead, the browser uploads the file directly to Supabase Storage,
// then calls this endpoint with just the metadata + file path.
// This route only: saves DB record + triggers the transcoder.
//
// Add this to next.config.js if you still need large body support elsewhere:
// experimental: { serverActions: { bodySizeLimit: '10mb' } }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { videoId, filePath, title, description, userId } = await req.json();

    if (!videoId || !filePath || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save metadata to DB
    const { error: dbError } = await supabase.from("videos").insert([
      {
        id: videoId,
        title,
        description,
        uploader: userId,
        status: "uploaded",
        raw_path: filePath,
      },
    ]);

    if (dbError) {
      console.error("DB error:", dbError.message);
      return NextResponse.json({ error: "Failed to save video metadata" }, { status: 500 });
    }

    // Fire-and-forget: trigger transcoder
    fetch(process.env.RENDER_TRANSCODE_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    }).catch((err) => console.error("Failed to trigger transcoder:", err));

    return NextResponse.json({ message: "Upload registered", videoId }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
