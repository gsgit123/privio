"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";

export default function RedeemPage() {
  const router = useRouter();
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWatchVideo = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = new URL(shareLink);
      const pathSegments = url.pathname.split('/');
      const videoId = pathSegments.find(segment => segment.length > 20);
      const token = url.searchParams.get('token');

      if (videoId && token) {
        router.push(`/dashboard/watch/${videoId}?token=${token}`);
      } else {
        throw new Error("Link format is incorrect.");
      }
    } catch (err) {
      setError("Invalid or malformed share link. Please check the URL and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10">
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
          <Link href="/dashboard" className="text-xl font-bold tracking-wider text-teal-400 uppercase">
            Privio
          </Link>
          <Link 
            href="/dashboard" 
            className="text-sm text-gray-400 hover:text-teal-400"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleWatchVideo} className="bg-gray-900/50 border border-teal-900/30 p-8 rounded-lg backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-500/10 border border-teal-500/50">
                <Ticket className="h-8 w-8 text-teal-400" />
              </div>
              <h1 className="text-3xl font-bold mt-4 text-teal-400">Redeem Share Link</h1>
              <p className="text-gray-400 mt-2">Paste the secure link you received to begin watching.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="share-link" className="block text-sm font-medium text-gray-300 mb-2">
                  Share Link
                </label>
                <input
                  id="share-link"
                  type="text"
                  value={shareLink}
                  onChange={(e) => setShareLink(e.target.value)}
                  placeholder="https://yoursite.com/dashboard/watch/..."
                  required
                  className="block w-full bg-gray-950 border border-teal-900/50 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !shareLink}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none disabled:bg-gray-700 disabled:cursor-not-allowed border border-teal-500/50"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                )}
                {loading ? "Redirecting..." : "Watch Now"}
              </button>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}