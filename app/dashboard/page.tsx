"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You must login first</p>;

  const handleLogout = async () => {
    await signOut();
    router.push("/auth"); // ✅ redirect to login page
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl">Welcome {user.email}</h1>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
