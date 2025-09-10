"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/client"

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string|null>(null);

    useEffect(()=>{
        const getUser=async()=>{
            const {data,error}=await supabase.auth.getUser();
            if(error){
                console.log("Auth error: ",error.message);
            }else{
                setUserId(data.user?.id??null);
            }
        };
        getUser();
    },[])

    const handleUpload = async () => {
        if (!file) return alert("Please select a file");
        if (!userId) return alert("User not authenticated");
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("userId", userId);


        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        })

        const data = await res.json();
        setLoading(false);

        if (data.error) {
            alert("Upload failed: " + data.error);
        } else {
            alert("Uploaded! Video ID: " + data.videoId);
        }
    }

    return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Upload Video</h1>
      <input
        type="text"
        placeholder="Title"
        className="border p-2 w-full"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description"
        className="border p-2 w-full"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="file"
        accept="video/mp4"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}