"use client";

import { useParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/client";
import Link from "next/link";


export default function AnalyticsPage(){
    const params=useParams();
    const videoId=params.videoId as string;

    const [viewCount, setViewCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        async function fetchAnalytics() {
            if (!videoId) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("You must be logged in to view analytics.");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/analytics/${videoId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch analytics data.");
                }
                
                const data = await res.json();
                setViewCount(data.viewCount);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchAnalytics();
    }, [videoId]);

    return (
        <div className="p-8 text-white">
            <Link href="/dashboard" className="text-blue-400 hover:underline mb-6 inline-block">&larr; Back to Dashboard</Link>
            <h1 className="text-2xl font-bold mb-6">Video Analytics</h1>
            <div className="bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-lg text-gray-400">Total Views</p>
                {loading ? (
                    <p className="text-4xl font-bold">...</p>
                ) : error ? (
                    <p className="text-lg font-bold text-red-500">{error}</p>
                ) : (
                    <p className="text-6xl font-bold">{viewCount}</p>
                )}
            </div>
        </div>
    );
}