import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest, context: any) {
  // cast params to the expected type
  const { videoId } = context.params as { videoId: string };

  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader?.split(" ")[1];
  if (!accessToken) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: video } = await supabase
    .from("videos")
    .select("id")
    .eq("id", videoId)
    .eq("uploader", user.id)
    .single();

  if (!video) return new NextResponse("Forbidden", { status: 403 });

  const userViewCountKey = `views:count:${videoId}`;
  const lastViewTimestampKey = `views:lastView:${videoId}`;

  const userViewCounts = await redis.hgetall(userViewCountKey);

  const analyticsData: { viewer: string; totalViews: number; lastViewed: string }[] = [];

  if (userViewCounts) {
    for (const [email, count] of Object.entries(userViewCounts)) {
      const lastViewScore = await redis.zscore(lastViewTimestampKey, email);
      analyticsData.push({
        viewer: email,
        totalViews: Number(count),
        lastViewed: lastViewScore ? new Date(Number(lastViewScore)).toLocaleString() : "N/A",
      });
    }
  }

  analyticsData.sort(
    (a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime()
  );

  return NextResponse.json({ analytics: analyticsData });
}
