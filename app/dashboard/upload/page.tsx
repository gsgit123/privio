"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a video file to upload.");
      return;
    }
    setLoading(true);
    setStatusMessage("Uploading...");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An unknown error occurred.");
      }
      
      setStatusMessage("Upload successful! Your video is now processing.");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setErrorMessage(`Upload failed: ${errorMessage}`);
      setStatusMessage("");
    } finally {
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
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-teal-900/30 p-8 rounded-lg backdrop-blur-sm space-y-6">
            <h1 className="text-3xl font-bold text-center text-teal-400">Upload Video</h1>
            
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                id="title" 
                type="text" 
                placeholder="My Awesome Video" 
                required
                className="block w-full bg-gray-950 border border-teal-900/50 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description" 
                placeholder="A short summary of your video..." 
                rows={4}
                className="block w-full bg-gray-950 border border-teal-900/50 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video File
              </label>
              <div className="flex justify-center px-6 py-12 border-2 border-dashed border-teal-900/50 rounded-lg bg-gray-950/50">
                <div className="space-y-3 text-center">
                  <svg 
                    className="mx-auto h-16 w-16 text-teal-500/50" 
                    stroke="currentColor" 
                    fill="none" 
                    viewBox="0 0 48 48"
                  >
                    <path 
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                  
                  <div className="text-sm text-gray-400">
                    <label 
                      htmlFor="file-upload" 
                      className="relative cursor-pointer font-medium text-teal-400 hover:text-teal-300"
                    >
                      <span>Click to select a file</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        onChange={handleFileChange} 
                        accept="video/mp4,video/webm,video/quicktime" 
                      />
                    </label>
                  </div>
                  
                  {file ? (
                    <p className="text-sm text-teal-400 font-medium">{file.name}</p>
                  ) : (
                    <p className="text-xs text-gray-500">MP4, WEBM, MOV up to 1GB</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none disabled:bg-gray-700 disabled:cursor-not-allowed border border-teal-500/50"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                )}
                {loading ? statusMessage : "Upload & Process Video"}
              </button>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                <p className="text-sm text-red-400 text-center">{errorMessage}</p>
              </div>
            )}
            {statusMessage && !loading && (
              <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/50">
                <p className="text-sm text-teal-400 text-center">{statusMessage}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}