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

    console.log(user);

    const timestamp = Date.now();

    const userViewCountKey=`views:count:${videoId}`;
    const lastViewTimestampKey =`views:lastView:${videoId}`;

    const multi =redis.multi();
    multi.hincrby(userViewCountKey, user.email!, 1);
    multi.zadd(lastViewTimestampKey, { score: timestamp, member: user.email! })
    await multi.exec();


    return NextResponse.json({ success:true,message: 'View count incremented' });

    
}