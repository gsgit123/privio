import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});


export async function GET(req: Request, { params }: { params: { videoId: string } }) {
    const {videoId}=params;


    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader?.split(' ')[1];
    if (!accessToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    // This tells the client to use the token for ALL future requests
                    Authorization: `Bearer ${accessToken}`
                }
            }
        }
    );
    
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log("Authenticated User ID:", user.id);
    console.log(videoId);


    const { data: video } = await supabase
        .from('videos')
        .select('id')
        .eq('id', videoId)
        .eq('uploader', user.id)
        .single();

    console.log(video);
    
    if (!video) {
        return new NextResponse('Forbidden', { status: 403 });
    }



    const key=`views:${videoId}`;
    const viewCount=await redis.get(key)||0;

    return NextResponse.json({videoId,viewCount:Number(viewCount)});
}