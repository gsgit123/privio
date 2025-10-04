"use client";

import { supabase } from "@/lib/client";

export default function LandingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const signInWithGoogle=async()=>{
    const {data,error}=await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{
        redirectTo:`${baseUrl}/dashboard`
      },
    });
    if(error)console.log("Error",error)
    }

  return (
    <div className="blueprint-bg flex h-screen flex-col items-center justify-center text-white">
      <div className="grid-lines"></div>
      <div className="glow-line"></div>
      
      <div className="relative z-10 text-center p-8">
        <div className="rounded-lg bg-black bg-opacity-30 p-8 backdrop-blur-sm border border-teal-900">
          <h1 className="text-5xl font-bold text-white tracking-widest uppercase">
            Privio
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Securely upload, transcode, and stream your private video content.
          </p>
          <button
            onClick={signInWithGoogle}
            className="mt-8 rounded-full bg-red-600 px-6 py-3 text-lg font-semibold text-white transition-transform hover:scale-105"
          >
            Get Started with Google
          </button>
        </div>
      </div>
    </div>
  );
}
// "use client"

// import { supabase } from "@/lib/client"
// import { useRouter } from "next/navigation"

// export default function LandingPage(){
//   const router=useRouter()
//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

//   const signInWithGoogle=async()=>{
//     const {data,error}=await supabase.auth.signInWithOAuth({
//       provider:"google",
//       options:{
//         redirectTo:`${baseUrl}/dashboard`
//       },
//     });
//     if(error)console.log("Error",error)
//   }
//   return (
//     <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
//       <h1 className="text-4xl font-bold">Welcome to Privio</h1>
//       <button
//         onClick={signInWithGoogle}
//         className="mt-6 rounded bg-red-600 px-4 py-2 text-lg"
//       >
//         Get Started with Google
//       </button>
//     </div>
//   )
// }

