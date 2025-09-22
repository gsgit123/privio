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

  // Function to get the public URL for a thumbnail
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
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="flex items-center justify-between bg-black px-6 py-4">
        <h1 className="text-xl font-bold">My Videos</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/upload" className="rounded bg-blue-600 px-3 py-1 text-sm font-medium">
            Upload New Video
          </Link>
          <Link href="/dashboard/redeem" className="rounded bg-green-600 px-3 py-1 text-sm font-medium">
            Watch Shared Video
          </Link>
          <span>{user?.email}</span>
          <button onClick={signOut} className="rounded bg-red-600 px-3 py-1 text-sm font-medium">
            Logout
          </button>
        </div>
      </nav>

      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Your Library</h2>
        {loading ? (
          <p>Loading your videos...</p>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* --- MODIFICATION START --- */}
            {videos.map((video) => {
              const thumbnailUrl = getThumbnailUrl(video.thumbnail_path);

              // Define the card's appearance once to avoid repetition
              const videoCard = (
                <div
                  className={`bg-gray-800 rounded-lg overflow-hidden transition-transform duration-300 
                  ${video.status === 'ready' ? 'transform hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <div className="relative w-full h-40 bg-gray-700 flex items-center justify-center">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />

                    ) : (
                      <span className="text-gray-400">
                        {video.status === 'ready' ? 'No Thumbnail' : 'Processing...'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate" title={video.title}>{video.title}</h3>
                    <p className={`text-sm capitalize ${video.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {video.status}
                    </p>
                    <Link
                      href={`/dashboard/manage/${video.id}`}
                      className="text-xs text-blue-400 hover:underline mt-2 inline-block"
                      onClick={(e) => e.stopPropagation()} // Prevents navigating to the watch page
                    >
                      Manage & Share
                    </Link>
                    <Link href={`/dashboard/analytics/${video.id}`}
                      className="text-xs text-green-400 hover:underline mt-2 inline-block ml-2"
                      onClick={(e) => e.stopPropagation()}>
                      Analytics
                    </Link>
                  </div>
                </div>
              );

              // Conditionally render the card as a link or a div with an alert
              if (video.status === 'ready') {
                return (
                  <Link href={`/dashboard/watch/${video.id}`} key={video.id}>
                    {videoCard}
                  </Link>
                );
              } else {
                return (
                  <div
                    key={video.id}
                    onClick={() => alert('This video is still processing. Please wait until the status is "ready".')}
                  >
                    {videoCard}
                  </div>
                );
              }
            })}
            {/* --- MODIFICATION END --- */}
          </div>
        ) : (
          <p>You haven&apos;t uploaded any videos yet. Click &quot;Upload New Video&quot; to get started.</p>
        )}
      </div>
    </div>
  );
}