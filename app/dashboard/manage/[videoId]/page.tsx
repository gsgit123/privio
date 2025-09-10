"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/client"; // Your client-side Supabase instance

export default function ManageVideoPage() {
  const params = useParams();
  const videoId = params.videoId as string;

  const [email, setEmail] = useState("");
  const [expiresInMinutes, setExpiresInMinutes] = useState(1440); 
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");


  const handleExpiryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = Number(e.target.value);
    // This will log the value the moment you select it from the dropdown
    console.log("Dropdown changed to:", newMinutes); 
    setExpiresInMinutes(newMinutes);
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    setError("");
    setShareLink("");
    console.log("input",expiresInMinutes);

    // 1. Get the current user session to access the token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setError("You must be logged in to share.");
      setLoading(false);
      return;
    }

    // 2. Make the API call with the Authorization header
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
    <div className="max-w-2xl mx-auto p-8 text-white">
      <Link href="/dashboard" className="text-blue-400 hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold mb-6">Share Video</h1>
      <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
        <div>
          <label className="block text-sm font-medium">Share with (recipient's email)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Link expires in</label>
          <select
            value={expiresInMinutes}
            onChange={handleExpiryChange}

            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2"
          >

           <option value={2}>2 Minutes</option>
          <option value={60}>1 Hour</option>
          </select>
        </div>
        <button
          onClick={handleGenerateLink}
          disabled={loading || !email}
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Generate Share Link"}
        </button>
        {shareLink && (
          <div className="mt-4 p-2 bg-gray-900 rounded">
            <p className="text-sm">Share this secure link with {email}:</p>
            <input 
              type="text" 
              readOnly 
              value={shareLink} 
              onClick={(e) => e.currentTarget.select()}
              className="w-full bg-gray-700 p-1 mt-1 rounded text-green-400 cursor-copy" 
            />
          </div>
        )}
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    </div>
  );
}