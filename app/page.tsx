"use client"

import { supabase } from "@/lib/client"
import { useRouter } from "next/navigation"

export default function LandingPage(){
  const router=useRouter()

  const signInWithGoogle=async()=>{
    const {data,error}=await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{
        redirectTo:"http://localhost:3000/dashboard"
      },
    });
    if(error)console.log("Error",error)
  }
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold">Welcome to My Private Netflix</h1>
      <button
        onClick={signInWithGoogle}
        className="mt-6 rounded bg-red-600 px-4 py-2 text-lg"
      >
        Get Started with Google
      </button>
    </div>
  )
}