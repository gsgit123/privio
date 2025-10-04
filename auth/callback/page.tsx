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
        } else if (userVideos) {
          setVideos(userVideos);
        }
        setLoading(false);
      }
    };
    getUserAndVideos();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="flex items-center justify-between bg-black/50 backdrop-blur-sm px-6 py-4 border-b border-gray-800 sticky top-0 z-50">
        <Link href="/dashboard" className="text-xl font-bold tracking-widest uppercase text-teal-400">
          Privio
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/redeem" className="rounded-md bg-gray-700 hover:bg-gray-600 px-3 py-1.5 text-sm font-medium transition-colors">
            Redeem Link
          </Link>
          <Link href="/dashboard/upload" className="rounded-md bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-sm font-medium transition-colors">
            Upload Video
          </Link>
          <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
          <button onClick={signOut} className="rounded-md bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-medium transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-200">Your Library</h2>
        
        {loading ? (
          // --- SKELETON LOADER ---
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg animate-pulse">
                <div className="w-full h-40 bg-gray-700 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="w-3/4 h-5 bg-gray-700 rounded"></div>
                  <div className="w-1/4 h-4 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => {
              const thumbnailUrl = getThumbnailUrl(video.thumbnail_path);
              const isReady = video.status === 'ready';

              const videoCard = (
                <div className={`group bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${!isReady ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-teal-500/20 transform hover:-translate-y-1'}`}>
                  <div className="relative w-full h-40 bg-gray-700 flex items-center justify-center overflow-hidden">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        {!isReady && <div className="w-8 h-8 border-2 border-t-teal-500 border-gray-600 rounded-full animate-spin"></div>}
                        <span className="text-gray-400 text-sm">
                          {isReady ? 'No Thumbnail' : 'Processing...'}
                        </span>
                      </div>
                    )}
                    {isReady && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
                            <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
                        </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate text-gray-100" title={video.title}>{video.title}</h3>
                    <p className={`text-sm capitalize font-medium ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                      {video.status}
                    </p>
                  </div>
                </div>
              );

              if (isReady) {
                return (
                  <Link href={`/dashboard/watch/${video.id}`} key={video.id}>
                    {videoCard}
                  </Link>
                );
              } else {
                return (
                  <div key={video.id} onClick={() => alert('This video is still processing. Please wait until the status is "ready".')}>
                    {videoCard}
                  </div>
                );
              }
            })}
          </div>
        ) : (
          // --- ENHANCED EMPTY STATE ---
          <div className="text-center py-20 px-6 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <h3 className="mt-4 text-lg font-medium text-white">No videos found</h3>
              <p className="mt-1 text-sm text-gray-400">Get started by uploading your first video.</p>
              <div className="mt-6">
                <Link href="/dashboard/upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                  Upload New Video
                </Link>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}