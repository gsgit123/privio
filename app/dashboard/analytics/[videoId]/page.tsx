"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/client";
import Link from "next/link";
import useSWR from "swr";

type AnalyticsData = {
    viewer: string;
    totalViews: number;
    lastViewed: string;
};

export default function AnalyticsPage() {
    const params = useParams();
    const videoId = params.videoId as string;
    
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!videoId) return;
        
        async function fetchAnalytics() {
            // Get the current user's session to get the access token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("You must be logged in to view analytics.");
                setLoading(false);
                return;
            }

            try {
                // Fetch the analytics data, providing the token for authorization
                const res = await fetch(`/api/analytics/${videoId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch analytics. You may not be the owner.");
                }

                const data = await res.json();
                setAnalytics(data.analytics);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchAnalytics();
    }, [videoId]);

    return (
        <div className="p-8 text-white bg-gray-900 min-h-screen">
            <Link href="/dashboard" className="text-blue-400 hover:underline mb-6 inline-block">&larr; Back to Dashboard</Link>
            <h1 className="text-3xl font-bold mb-6">Video Analytics</h1>

            {loading ? (
                <p>Loading analytics...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4 font-semibold">Viewer</th>
                                <th className="p-4 font-semibold text-center">Total Views</th>
                                <th className="p-4 font-semibold">Last Viewed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.length > 0 ? (
                                analytics.map((data) => (
                                    <tr key={data.viewer} className="border-t border-gray-700">
                                        <td className="p-4">{data.viewer}</td>
                                        <td className="p-4 text-center">{data.totalViews}</td>
                                        <td className="p-4">{data.lastViewed}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center p-8 text-gray-400">No views recorded for this video yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}