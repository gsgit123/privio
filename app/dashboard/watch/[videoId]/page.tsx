"use client";

import HlsPlayer from "@/components/HlsPlayer";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/client";

export default function WatchPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const [videoTitle, setVideoTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoggedView = useRef(false);

  console.log("wathc page rendered");


  useEffect(() => {
    const fetchVideoTitle = async () => {
      if (!videoId) return;

      const { data: video, error } = await supabase
        .from('videos')
        .select('title')
        .eq('id', videoId)
        .single();

      if (error) {
        setError("Could not load video details. You may not have permission to view this.");
        console.error("Error fetching title:", error);
      } else {
        setVideoTitle(video.title);
      }
      setLoading(false);
    };

    fetchVideoTitle();
  }, [videoId]);

  const manifestUrl = `/api/videos/${videoId}`;

  const handlePlay = async () => {
    if (!hasLoggedView.current) {
      hasLoggedView.current = true;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetch('/api/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ videoId: videoId })
        })
      }
    }

  }

  return (
    <div className="bg-black min-h-screen text-white flex flex-col">
      <header className="p-4 flex justify-between items-center bg-gray-900">
        <h1 className="text-xl font-bold truncate">
          {loading ? "Loading..." : videoTitle}
        </h1>
        <Link href="/dashboard" className="text-sm text-blue-400 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : videoId ? (
          <div className="w-full max-w-5xl">
            <HlsPlayer url={manifestUrl} onPlay={handlePlay} />
          </div>
        ) : (
          <p>Loading player...</p>
        )}
      </main>
    </div>
  );
}