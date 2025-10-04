"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/client";
import { Share2, Copy, Check } from "lucide-react";

export default function ManageVideoPage() {
  const params = useParams();
  const videoId = params.videoId as string;

  const [email, setEmail] = useState("");
  const [expiresInMinutes, setExpiresInMinutes] = useState(1440); 
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleExpiryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = Number(e.target.value);
    console.log("Dropdown changed to:", newMinutes); 
    setExpiresInMinutes(newMinutes);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    setError("");
    setShareLink("");
    console.log("input", expiresInMinutes);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setError("You must be logged in to share.");
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/videos/${videoId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        sharedWithEmail: email,
        expiresInMinutes: expiresInMinutes
      })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Failed to generate link.");
    } else {
      setShareLink(data.shareLink);
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
      <div className="relative max-w-2xl mx-auto p-8">
        <div className="bg-gray-900/50 border border-teal-900/30 p-8 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/50 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-teal-400" />
            </div>
            <h1 className="text-3xl font-bold text-teal-400">Share Video</h1>
          </div>

          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient&apos;s Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="block w-full bg-gray-950 border border-teal-900/50 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Expiry Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Link Expires In
              </label>
              <select
                value={expiresInMinutes}
                onChange={handleExpiryChange}
                className="block w-full bg-gray-950 border border-teal-900/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-teal-500"
              >
                <option value={2}>2 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={1440}>24 Hours</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateLink}
              disabled={loading || !email}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none disabled:bg-gray-700 disabled:cursor-not-allowed border border-teal-500/50"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              )}
              {loading ? "Generating..." : "Generate Share Link"}
            </button>

            {/* Share Link Display */}
            {shareLink && (
              <div className="p-4 bg-gray-950 border border-teal-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">
                  Share this secure link with <span className="text-teal-400 font-medium">{email}</span>:
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareLink} 
                    className="flex-1 bg-gray-900 border border-teal-900/50 p-3 rounded-lg text-teal-400 text-sm" 
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-3 rounded-lg border border-teal-500/50 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}