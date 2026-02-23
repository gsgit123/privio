import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// Initialize Supabase admin client
const supaBaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ videoId: string }> }
) {
  const resolvedParams = await params;
  const videoId = resolvedParams.videoId;

  if (!videoId) {
    return new NextResponse('Missing videoId', { status: 400 });
  }

  const bucketName = 'hls';
  const folderPath = `${videoId}`;
  const manifestPath = `${folderPath}/playlist.m3u8`;

  const { data: playlistData, error: playlistError } = await supaBaseAdmin
    .storage
    .from(bucketName)
    .download(manifestPath);

  if (playlistError || !playlistData) {
    console.error("Error downloading playlist:", playlistError);
    return new NextResponse('Failed to download playlist', { status: 404 });
  }

  let playlistText = await playlistData.text();
  const tsFileNames = playlistText.split('\n').filter((line) => line.endsWith('.ts'));
  const tsFilePaths = tsFileNames.map(name => `${folderPath}/${name}`);

  if (tsFileNames.length === 0) {
    console.error("No .ts files found in playlist");
    return new NextResponse('No .ts files found in playlist', { status: 404 });
  }

  const { data: signedUrlsData, error: signError } = await supaBaseAdmin
    .storage
    .from(bucketName)
    .createSignedUrls(tsFilePaths, 3600);

  if (signError || !signedUrlsData) {
    console.error('Error signing URLs:', signError);
    return new NextResponse('Could not sign segment URLs', { status: 500 });
  }

  // Replace .ts filenames in playlist with signed URLs
  for (const signedUrl of signedUrlsData) {
    if(!signedUrl.path)continue;
    const fileName = signedUrl.path.split('/').pop();
    if (fileName) {
      playlistText = playlistText.replace(fileName, signedUrl.signedUrl);
    }
  }

  return new NextResponse(playlistText, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl'
    }
  });
}
