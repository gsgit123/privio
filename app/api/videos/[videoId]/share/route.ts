import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This line forces the route to be dynamic, fixing issues with reading params and headers.
export const dynamic = 'force-dynamic';

export async function POST(req: Request, context:{params:Promise<{videoId: string}>}) {
  const { videoId } = await context.params;
  const { sharedWithEmail, expiresInMinutes } = await req.json();

  // 1. Get the token from the Authorization header
  const authHeader = req.headers.get('Authorization');
  const accessToken = authHeader?.split(' ')[1]; // Removes "Bearer "

  if (!accessToken) {
    return new NextResponse('Unauthorized: No token provided', { status: 401 });
  }

  // 2. Create a Supabase client to verify the token
  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  }
);

  
  const { data: { user: owner }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !owner) {
    return new NextResponse('Unauthorized: Invalid token', { status: 401 });
  }
  console.log('Authenticated user:', owner);

  // --- User is now authenticated, proceed with logic ---

  // 3. Verify that the authenticated user owns the video
  const { data: video } = await supabase
    .from('videos')
    .select('id')
    .eq('id', videoId)
    .eq('uploader', owner.id)
    .single();

  console.log('Video fetched:', video);
  
  if (!video) {
    return new NextResponse('Forbidden: You do not own this video.', { status: 403 });
  }

  // 4. Create a Supabase Admin Client to securely look up the recipient
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );


  // 5. Create the share record in the database
  const now=new Date();
  const expirationDate = new Date(now.getTime()+expiresInMinutes*60000);
  




  const { data: newShare, error: insertError } = await supabaseAdmin
    .from('shares')
    .insert({
      video_id: videoId,
      shared_by_user_id: owner.id,
      shared_with_email:sharedWithEmail,
      token_expires_at: expirationDate.toISOString(),
    })
    .select('share_token')
    .single();
    
  if (insertError) {
    console.error('Error creating share:', insertError);
    return new NextResponse('Could not create share link.', { status: 500 });
  }
  
  // 6. Construct and return the final share link
  const shareLink = `${process.env.BASE_URL}/dashboard/watch/${videoId}?token=${newShare.share_token}`;
  
  return NextResponse.json({ shareLink });
}