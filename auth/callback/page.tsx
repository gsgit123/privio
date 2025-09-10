"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/client";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Auth error:", error.message);
        router.push("/"); // back to landing
      } else {
        router.push("/dashboard"); // success → go to dashboard
      }
    };
    handleAuth();
  }, [router]);

  return <p>Signing you in...</p>;
}
