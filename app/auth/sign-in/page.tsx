"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignIn() {
  const supabase = createClientComponentClient();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) {
      alert('Error signing in: ' + error.message);
      return;
    }

    // Wait for the user to be signed in and session to be available
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user exists in users table
        const { data: existing, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
        if (!existing) {
          // Insert user record
          await supabase.from('users').insert({ id: user.id, email: user.email });
        }
      }
    }, 2000); // Wait 2 seconds for session propagation
  };

  return (
    <div className="h-lvh bg-white">
      <div className="flex flex-col justify-center items-center h-full">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <div className="mt-4 flex flex-col gap-4">
          <button
            onClick={handleGoogleSignIn}
            className="rounded-md shadow-2xl bg-zinc-100 hover:bg-zinc-300 font-bold p-3 flex flex-row items-center justify-center gap-2"
          >
            {/* Google SVG */}
            Sign In with Google
          </button>
        </div>
      </div>
    </div>
  );
}