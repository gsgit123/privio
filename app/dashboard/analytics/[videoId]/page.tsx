"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/client";
import Link from "next/link";
import { BarChart3, Eye, Clock, User } from "lucide-react";

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
                    throw new Error("Failed to fetch analytics. You may not be the owner.");
                }

                const data = await res.json();
                setAnalytics(data.analytics);

            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [videoId]);

    const totalViews = analytics.reduce((sum, data) => sum + data.totalViews, 0);
    const uniqueViewers = analytics.length;

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
            <div className="relative p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                    
                        <h1 className="text-3xl font-bold text-purple-400">Video Analytics</h1>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
                                <p className="text-gray-400">Loading analytics...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <div className="mb-4 inline-block p-4 rounded-full bg-red-500/10 border border-red-500/50">
                                <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-red-400 text-lg">{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-900/50 border border-teal-900/30 rounded-lg p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/50 flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-teal-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Total Views</p>
                                            <p className="text-2xl font-bold text-teal-400">{totalViews}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 border border-purple-900/30 rounded-lg p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/50 flex items-center justify-center">
                                            <User className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Unique Viewers</p>
                                            <p className="text-2xl font-bold text-purple-400">{uniqueViewers}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-gray-900/50 border border-teal-900/30 rounded-lg overflow-hidden backdrop-blur-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-950/50 border-b border-teal-900/30">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    Viewer
                                                </div>
                                            </th>
                                            <th className="p-4 font-semibold text-gray-300 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    Total Views
                                                </div>
                                            </th>
                                            <th className="p-4 font-semibold text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Last Viewed
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.length > 0 ? (
                                            analytics.map((data) => (
                                                <tr key={data.viewer} className="border-t border-teal-900/20 hover:bg-gray-950/30">
                                                    <td className="p-4 text-gray-300">{data.viewer}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="inline-block px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/50 text-teal-400 font-semibold">
                                                            {data.totalViews}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-400">{data.lastViewed}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center p-12">
                                                    <div className="text-gray-500">
                                                        <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                        <p>No views recorded for this video yet.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}