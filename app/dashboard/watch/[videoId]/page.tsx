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

  console.log("watch page rendered");

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
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(0, 128, 128, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 128, 128, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative border-b border-teal-900/30 bg-gray-900 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-wider text-teal-400 truncate max-w-xl">
            {loading ? "Loading..." : videoTitle}
          </h1>
          <Link 
            href="/dashboard" 
            className="text-sm text-gray-400 hover:text-teal-400 whitespace-nowrap"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative flex-grow flex items-center justify-center p-8">
        {error ? (
          <div className="text-center">
            <div className="mb-4 inline-block p-4 rounded-full bg-red-500/10 border border-red-500/50">
              <svg 
                className="w-12 h-12 text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <p className="text-red-400 text-lg">{error}</p>
            <Link 
              href="/dashboard"
              className="mt-6 inline-block rounded-lg border border-teal-500/50 bg-teal-500/10 px-6 py-2 text-sm font-medium text-teal-400 hover:bg-teal-500/20"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : videoId ? (
          <div className="w-full max-w-6xl">
            <div className="rounded-lg overflow-hidden border border-teal-900/30 shadow-2xl shadow-teal-500/10">
              <HlsPlayer url={manifestUrl} onPlay={handlePlay} />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-400">Loading player...</p>
          </div>
        )}
      </main>
    </div>
  );
}