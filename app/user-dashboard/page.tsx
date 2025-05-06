'use client'

import UserDashboard from "@/components/use-dashboard";
import { MantineProvider } from "@mantine/core";
import { useSession } from 'next-auth/react'
import { useEffect, useState } from "react"; // Import useEffect to log after initial render

export default function ProductList() {
  // useSession returns { data: session, status: 'loading' | 'authenticated' | 'unauthenticated' }
  const { data: session, status } = useSession();
  const [email, setEmail] = useState<string>();

  // Use useEffect to log after the component mounts and state updates
  useEffect(() => {
      console.log("Session Status:", status);
      console.log("Full Session Object:", session);
      console.log("email (from session?.user?.email):", session?.user?.email);
      
      if (session?.user?.email) {
        setEmail(session?.user?.email);
      }
  }, [session, status]); // Log whenever session or status changes

  // If status is 'authenticated', session should not be null
  return (
    <MantineProvider>
      <main className="flex flex-col w-full overflow-x-hidden">
        {/* Pass the email, it will be null if the user object or email is missing */}
        { email  && <UserDashboard />}
      </main>
    </MantineProvider>
  );
}