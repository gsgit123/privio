"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RedeemPage() {
  const router = useRouter();
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");

  const handleWatchVideo = () => {
    setError("");
    try {
      // Create a URL object to easily parse the link
      const url = new URL(shareLink);
      
      // Extract the pathname (e.g., /dashboard/watch/video-id)
      const pathSegments = url.pathname.split('/');
      const videoId = pathSegments[pathSegments.length - 1];

      // Extract the token from the search parameters
      const token = url.searchParams.get('token');

      // Check if both parts were found
      if (videoId && token) {
        // Redirect the user to the watch page with the correct params
        router.push(`/dashboard/watch/${videoId}?token=${token}`);
      } else {
        throw new Error("Link format is incorrect.");
      }
    } catch (err) {
      setError("Invalid or malformed share link. Please check the URL and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Watch a Shared Video</h1>
                <p className="text-gray-400 mt-2">Paste the secure link you received to begin watching.</p>
            </div>
            <div className="p-8 space-y-6 bg-gray-800 rounded-lg">
                <div>
                <label htmlFor="share-link" className="block text-sm font-medium">
                    Paste Share Link
                </label>
                <input
                    id="share-link"
                    type="text"
                    value={shareLink}
                    onChange={(e) => setShareLink(e.target.value)}
                    placeholder="https://yoursite.com/dashboard/watch/..."
                    className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                />
                </div>
                <button
                onClick={handleWatchVideo}
                disabled={!shareLink}
                className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold"
                >
                Watch Now
                </button>
                {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}
            </div>
             <div className="text-center mt-6">
                <Link href="/dashboard" className="text-sm text-blue-400 hover:underline">
                    &larr; Back to Dashboard
                </Link>
            </div>
        </div>
    </div>
  );
}