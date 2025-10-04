"use client";

import { supabase } from "@/lib/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type User } from "@supabase/supabase-js";
import Image from "next/image";

type Video = {
  id: string;
  title: string;
  status: string;
  thumbnail_path: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const getThumbnailUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('thumbnails').getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const getUserAndVideos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
        const { data: userVideos, error } = await supabase
          .from("videos")
          .select("id, title, status, thumbnail_path")
          .eq("uploader", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching videos:", error);
        } else {
          setVideos(userVideos);
        }
        setLoading(false);
      }
    };
    getUserAndVideos();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(0, 128, 128, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 128, 128, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'pan-grid 20s linear infinite'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative border-b border-teal-900/30 bg-gray-900 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-wider text-teal-400 uppercase">Privio</h1>
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/upload" 
              className="rounded-lg border border-teal-500/50 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400 hover:bg-teal-500/20"
            >
              Upload New Video
            </Link>
            <Link 
              href="/dashboard/redeem" 
              className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20"
            >
              Watch Shared Video
            </Link>
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button 
              onClick={signOut} 
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative p-8">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Your Library
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => {
              const thumbnailUrl = getThumbnailUrl(video.thumbnail_path);
              const isReady = video.status === 'ready';

              const handleCardClick = () => {
                if (isReady) {
                  router.push(`/dashboard/watch/${video.id}`);
                } else {
                  alert('This video is still processing. Please wait until the status is "ready".');
                }
              };

              return (
                <div
                  key={video.id}
                  onClick={handleCardClick}
                  className={`rounded-lg border overflow-hidden transition-all duration-300 ${
                    isReady 
                      ? 'border-teal-900/50 bg-gray-900/50 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 cursor-pointer' 
                      : 'border-yellow-900/30 bg-gray-900/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full h-40 bg-gray-950 flex items-center justify-center">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={video.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {isReady ? 'No Thumbnail' : 'Processing...'}
                      </span>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`absolute top-2 right-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      isReady 
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' 
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    }`}>
                      {video.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold truncate mb-2" title={video.title}>
                      {video.title}
                    </h3>
                    
                    <div className="flex gap-2 text-xs">
                      <Link
                        href={`/dashboard/manage/${video.id}`}
                        className="text-cyan-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Manage & Share
                      </Link>
                      <span className="text-gray-600">•</span>
                      <Link
                        href={`/dashboard/analytics/${video.id}`}
                        className="text-purple-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Analytics
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">
              You haven&apos;t uploaded any videos yet.
            </p>
            <Link 
              href="/dashboard/upload"
              className="inline-block rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 font-semibold text-white hover:shadow-lg hover:shadow-teal-500/30"
            >
              Upload Your First Video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}