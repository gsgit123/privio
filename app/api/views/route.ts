import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});


export async function POST(req:Request){
    const {videoId}=await req.json();


    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!videoId) {
        return new NextResponse('videoId is required', { status: 400 });
    }

    const key=`views:${videoId}`;
    await redis.incr(key);

    return NextResponse.json({ success:true,message: 'View count incremented' });

    
}