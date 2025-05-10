'use client'; // Ensure this is at the very top

import { createClient } from '@supabase/supabase-js';
// import { notFound } from 'next/navigation'; // notFound is typically for Server Components hitting specific routes
import { Box, Title, Text, Loader, Button as MantineButton, SimpleGrid, AspectRatio, Card, Group, Stack } from '@mantine/core'; // Added Loader and MantineButton
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
    imageUrl: string; // Base64 data for the image
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

    if (status === 'unauthenticated') {
        return (
            <Box p="xl" ta="center">
                <Title order={2}>Sign In Required</Title>
                <Text>Please sign in to view your saved designs.</Text>
            </Box>
        );
    }
    const originalStageWidth = 300;
    const originalStageHeight = 600;

    const previewScaleFactor = 0.5;

    const scaledWidth = originalStageWidth * previewScaleFactor;
    const scaledHeight = originalStageHeight * previewScaleFactor;

    return (
        <div className="flex flex-col w-full min-h-screen">
            <Title order={1} ta="center" mb="xl">My Saved Designs</Title>

            <div className="flex-row items-start justify-center">
                {designs.map((designItem) => (
                    <div>
                        <DesignDisplay
                            designDataJson={designItem.design_data}
                            phoneModel={designItem.phone_model}
                            caseMaterial={designItem.case_material}
                            caseStyle={designItem.case_style}
                            visualWidth={scaledWidth}
                            visualHeight={scaledHeight}
                        />


                        <Stack gap="xs" mt="md" mb="xs">
                            <Text fw={700} size="md">{designItem.phone_model}</Text>
                            <Group justify="space-between"> {/* Group is horizontal */}
                                <Text size="sm" c="dimmed">{designItem.case_material}</Text>
                                <Text size="sm" c="dimmed">{designItem.case_style}</Text>
                            </Group>
                            <Text size="xs" c="gray">Saved on: {new Date(designItem.created_at).toLocaleDateString()}</Text>
                        </Stack>
                    </div>
                ))}
            </div>
        </div>
    );
}