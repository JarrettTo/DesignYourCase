'use client'; // Ensure this is at the very top

import { createClient } from '@supabase/supabase-js';
// import { notFound } from 'next/navigation'; // notFound is typically for Server Components hitting specific routes
import { Box, Title, Text, Loader, Button as MantineButton } from '@mantine/core'; // Added Loader and MantineButton
import { useSession } from 'next-auth/react' // Keep useSession

// Import the DesignDisplay component
import DesignDisplay from '@/components/design-display'; // Adjust path as needed
import { useEffect, useState } from 'react';

interface LoadedScribble {
    id: string;
    x: number;
    y: number;
    points: number[];
    fillColor: string; // Stroke color
}

interface LoadedImage {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    base64: string; // Base64 data for the image
    rotation?: number; // Include rotation if you saved it
}

interface LoadedTextElement {
    id: string;
    x: number;
    y: number;
    fontSize: number;
    text: string;
    fontFamily: string;
    fill: string;
    rotation?: number; // Include rotation if you saved it
}

interface LoadedDesignData {
    scribbles: LoadedScribble[];
    images: LoadedImage[];
    textElements: LoadedTextElement[];
}


interface FetchedDesign {
    id: string;
    created_at: string; 
    user_id: string | null; 
    design_data: LoadedDesignData;
    image_url: string; 
    phone_model: string;
    case_material: string;
    case_style: string; 
}


// It doesn't need to accept 'email' as a prop, it gets it from useSession
export default function DesignListPage() { // Renamed component to reflect it lists designs
    const { data: session, status } = useSession(); // Get session and loading status

    // State to hold the array of fetched designs
    const [designs, setDesigns] = useState<FetchedDesign[]>([]);
    const [isLoading, setIsLoading] = useState(true); // State to manage loading feedback
    const [error, setError] = useState<string | null>(null); // State to manage fetch errors


    // Function to fetch designs from your API route
    const getCases = async (userEmail: string | undefined | null) => {
        setIsLoading(true);
        setError(null); // Clear previous errors
        try {
            const response = await fetch('/api/get-saved-cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send the user's email in the request body
                body: JSON.stringify({ email: userEmail }),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Failed to fetch designs');
            }

            // Your API route should return an array of design objects
            const result: FetchedDesign[] = await response.json();
            console.log("Fetched Designs:", result);

            setDesigns(result); // Update state with the fetched array

        } catch (err: any) {
            console.error('Error fetching designs:', err);
            setError(err.message || 'Failed to load designs.'); // Store error message
            setDesigns([]); // Clear designs on error
        } finally {
            setIsLoading(false); // End loading
        }
    }

    // useEffect to trigger data fetching when the session email is available
    useEffect(() => {
        // Fetch designs ONLY when the session status is authenticated AND the email is available
        if (status === 'authenticated' && session?.user?.email) {
            getCases(session.user.email);
        } else if (status === 'unauthenticated') {
             // If not authenticated, clear designs and stop loading
            setDesigns([]);
            setIsLoading(false);
             setError('Please sign in to view your saved designs.'); // Show message for unauthenticated
        }
        // If status is 'loading', do nothing, wait for it to become authenticated/unauthenticated

    }, [session, status]); // Depend on session and status changes

    // --- Render Logic ---

    // Show loading state
    if (isLoading) {
        return (
            <Box p="xl" ta="center">
                <Loader size="lg" />
                <Text mt="md">Loading designs...</Text>
            </Box>
        );
    }

    // Show error message
    if (error) {
         return (
            <Box p="xl" ta="center">
                <Title order={2}>Error</Title>
                <Text>{error}</Text>
                 {/* Optional: Button to retry fetching */}
                 {status === 'authenticated' && session?.user?.email && (
                     <MantineButton onClick={() => getCases(session?.user?.email)} mt="lg">Retry Loading</MantineButton>
                 )}
            </Box>
         );
    }

    // Show message if no designs are found after loading
    if (designs.length === 0 && status === 'authenticated') {
         return (
            <Box p="xl" ta="center">
                <Title order={2}>No Designs Found</Title>
                <Text>It looks like you haven't saved any designs yet.</Text>
                 {/* Optional: Button to go create a design */}
                 <MantineButton component="a" href="/" mt="lg">Create a Design</MantineButton> {/* Adjust '/' to your selection page path */}
            </Box>
         );
    }

     // Show message if user is not signed in
     if (status === 'unauthenticated') {
         return (
             <Box p="xl" ta="center">
                 <Title order={2}>Sign In Required</Title>
                 <Text>Please sign in to view your saved designs.</Text>
                 {/* Optional: Add a sign-in button if you have one */}
                 {/* <MantineButton onClick={() => signIn('google')} mt="lg">Sign In</MantineButton> */}
             </Box>
         );
     }


    // If not loading, no error, and designs exist, map over them
    return (
        <Box p="xl"> {/* Use a layout box for the entire list page */}
            <Title order={1} ta="center" mb="xl">My Saved Designs</Title>

            {/* Iterate over the designs array and render DesignDisplay for each */}
            {designs.map((designItem) => (
                // Use a key prop for each item when mapping over arrays
                <Box key={designItem.id} mb="xl" pb="xl" style={{ borderBottom: '1px solid #eee' }}> {/* Add styling for separation */}
                    {/* Display some info about the design item */}
                     <Text ta="center" size="lg" mb="md" fw={600}>
                         {designItem.phone_model} | {designItem.case_material} | {designItem.case_style}
                     </Text>
                     {/* You could also display created_at, etc. */}
                     {/* <Text size="sm" c="dimmed" ta="center">Saved on: {new Date(designItem.created_at).toLocaleString()}</Text> */}


                    {/* Render the DesignDisplay component for the individual design */}
                    <DesignDisplay
                        designDataJson={designItem.design_data} // Pass the JSON string
                        phoneModel={designItem.phone_model}
                        caseMaterial={designItem.case_material}
                        caseStyle={designItem.case_style}
                    />
                     {/* Optional: Add buttons like 'Edit' or 'Add to Cart' for each design */}
                </Box>
            ))}
        </Box>
    );
}