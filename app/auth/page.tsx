'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';


export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { signIn, signUp } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);


    const handleSubmit = async () => {
        try {
            if (isLogin) await signIn(email, password);
            else await signUp(email, password);
            alert("Success!");
            router.push('/dashboard');
        } catch (error: any) {
            alert(error.message);
        }
    }

    return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold">{isLogin ? "Login" : "Sign Up"}</h1>

      <input
        className="border p-2 rounded w-64"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 rounded w-64"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded w-64"
      >
        {isLogin ? "Login" : "Sign Up"}
      </button>

      <p
        className="text-sm underline cursor-pointer"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
      </p>
    </div>
  );

}