"use client";

import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/client";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setErrorMsg("Please select a video file.");
      return;
    }
    setFile(f);
    setErrorMsg("");
    setTitle((prev) => prev || f.name.replace(/\.[^/.]+$/, ""));
  };

  // ✅ Logic duplicated inside so useCallback has no external deps
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (!dropped.type.startsWith("video/")) {
      setErrorMsg("Please select a video file.");
      return;
    }
    setFile(dropped);
    setErrorMsg("");
    setTitle((prev) => prev || dropped.name.replace(/\.[^/.]+$/, ""));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setState("uploading");
    setProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setState("error"); setErrorMsg("Not authenticated."); return; }

    const videoId = uuidv4();
    const filePath = `${videoId}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from("raw_uploads")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setState("error");
      setErrorMsg(uploadError.message);
      return;
    }

    setProgress(100);
    setState("processing");

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, filePath, title, description, userId: user.id }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setState("error");
      setErrorMsg(error || "Failed to register upload.");
      return;
    }

    setState("done");
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(0,128,128,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,128,128,0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <nav className="relative border-b border-teal-900/30 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wider text-teal-400 uppercase">Privio</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-400 hover:text-teal-400">
          ← Back
        </button>
      </nav>

      <main className="relative flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Upload Video
          </h2>

          {state === "done" ? (
            <div className="text-center py-12 rounded-xl border border-teal-500/30 bg-teal-500/5">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-teal-400 font-semibold text-lg">Upload complete!</p>
              <p className="text-gray-400 text-sm mt-1">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
                  isDragging ? "border-teal-400 bg-teal-500/10"
                  : file ? "border-teal-600 bg-teal-900/10"
                  : "border-gray-700 hover:border-teal-700 hover:bg-gray-900/50"
                }`}
              >
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <div className="text-3xl mb-2">🎬</div>
                    <p className="text-teal-400 font-medium">{file.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-2 opacity-40">📁</div>
                    <p className="text-gray-400">Drop your video here or <span className="text-teal-400">browse</span></p>
                    <p className="text-gray-600 text-xs mt-1">MP4, MOV, MKV, etc.</p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition resize-none"
                  placeholder="Optional description..."
                />
              </div>

              {(state === "uploading" || state === "processing") && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{state === "uploading" ? "Uploading to storage..." : "Registering & triggering transcoder..."}</span>
                    {state === "uploading" && <span>{progress}%</span>}
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300 rounded-full"
                      style={{ width: state === "processing" ? "100%" : `${progress}%` }}
                    />
                  </div>
                  {state === "processing" && (
                    <p className="text-xs text-gray-500 mt-1">Your video will be transcoded in the background. You can leave this page.</p>
                  )}
                </div>
              )}

              {errorMsg && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{errorMsg}</p>
              )}

              <button type="submit"
                disabled={!file || !title.trim() || state === "uploading" || state === "processing"}
                className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-200"
              >
                {state === "uploading" ? "Uploading..." : state === "processing" ? "Processing..." : "Upload Video"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
