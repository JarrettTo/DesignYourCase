'use client'; // Ensure this is at the very top

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image'; // Needed for the case background image
import Konva from 'konva'; // Import Konva for types
import { Box, Button as MantineButton, Text as MantineText, Title, Loader } from '@mantine/core'; // Use Mantine components

// --- Interfaces for Loaded Design Data ---
// These should match the structure saved in design_data JSON

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

// Interface for the structure *inside* the design_data JSON string
interface ParsedDesignData {
    scribbles: LoadedScribble[];
    images: LoadedImage[]; // Array of image data with imageUrl
    textElements: LoadedTextElement[];
}

// --- Props for the Display Component ---
interface DesignDisplayProps {
    designDataJson: ParsedDesignData; // <--- Expect the JSON string here
    phoneModel: string; // The saved phone_model
    caseMaterial: string; // The saved case_type (material ID)
    caseStyle: string; // The saved color (style ID)
    visualWidth: number;
    visualHeight: number;
}

// <--- MAPPINGS (Copy from your Editor page and other necessary parts) --->
// Map phone model name to its corresponding SVG path
const phoneModelSvgMapping: { [key: string]: string | undefined } = {
    // ... (Your phone model SVG paths here, make sure this list is comprehensive) ...
    'iPhone 12': '/assets/frames/iphone-12/Iphone 12.svg',
    'iPhone 12 Pro': '/assets/frames/iphone-12/Iphone 12 pro.svg',
    'iPhone 12 Pro Max': '/assets/frames/iphone-12/Iphone 12 pro max.svg',
    'iPhone 13': '/assets/frames/iphone-13/iPhone 13.svg',
    'iPhone 13 Pro': '/assets/frames/iphone-13/iPhone 13 pro.svg',
    'iPhone 13 Pro Max': '/assets/frames/iphone-13/iPhone 13 pro max.svg',
    'iPhone 14': '/assets/frames/iphone-14/iPhone 14.svg',
    'iPhone 14 Pro': '/assets/frames/iphone-14/iPhone 14 pro.svg',
    'iPhone 14 Pro Max': '/assets/frames/iphone-14/iPhone 14 pro max.svg',
    // Include all other models...
};

// Map style ID to color hex code for the case background
const caseStyleColorMapping: { [key: string]: string | undefined } = {
    'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF', 'black': '#000000',
    // Include all other style IDs...
};

// Determine if a material should have a colored background
const materialsWithColoredBackground: string[] = [
    'silicone', 'holo', 'full-wrap', 'mirror',
];
// <--- END MAPPINGS --->


// Define the canvas size (Should match or be proportional to the editor size)
const phoneCaseClip = {
    x: 0,
    y: 0,
    width: 300,
    height: 600,
};


function DesignDisplay({ designDataJson, phoneModel, caseMaterial, caseStyle, visualWidth, visualHeight }: DesignDisplayProps) {

    // State to hold the parsed design data object
    const [parsedDesignData, setParsedDesignData] = useState<ParsedDesignData | null>(null);
    // State to hold the *loaded* Konva Image elements (HTMLImageElement) mapped by ID
    const [konvaImages, setKonvaImages] = useState<Map<string, HTMLImageElement>>(new Map());

    // States for loading and error feedback specific to this component's rendering
    const [isLoadingDesign, setIsLoadingDesign] = useState(true);
    const [errorLoadingDesign, setErrorLoadingDesign] = useState<string | null>(null);


    // Determine background elements based on props
    const phoneSvgPath = phoneModel ? phoneModelSvgMapping[phoneModel] : undefined;
    const caseBackgroundColor = caseStyle ? caseStyleColorMapping[caseStyle] : undefined;
    const showColoredBackground = caseMaterial ? materialsWithColoredBackground.includes(caseMaterial) : false;

    // Load the phone case background image
    const [caseImage, caseImageStatus] = useImage(phoneSvgPath || '');


    // Effect to parse JSON and load images when the JSON string prop changes
    useEffect(() => {
        // Declare loadPromises here so it's accessible in the cleanup function
        let loadPromises: Promise<{ id: string, img: HTMLImageElement }>[] | undefined;


        if (!designDataJson) {
            setParsedDesignData(null);
            setKonvaImages(new Map()); // Clear loaded images
            setIsLoadingDesign(false);
            setErrorLoadingDesign('No design data provided.');
            return;
        }

        setIsLoadingDesign(true);
        setErrorLoadingDesign(null); // Clear previous errors
        setKonvaImages(new Map()); // Clear previous loaded images before parsing/loading new ones

        try {
            // --- 1. Parse the JSON string ---
            const parsedData: ParsedDesignData = designDataJson;
            setParsedDesignData(parsedData);

            // --- 2. Load images asynchronously from URLs ---
            if (parsedData.images.length === 0) {
                // No images to load, finish loading process
                setIsLoadingDesign(false);
                loadPromises = []; // Ensure loadPromises is defined even if empty
                return;
            }

            // Assign the array of promises to the variable declared outside the try block
            loadPromises = parsedData.images.map(imgData => {
                return new Promise<{ id: string, img: HTMLImageElement }>((resolve, reject) => {
                    if (!imgData.imageUrl) {
                        console.warn(`Design data contains image ID ${imgData.id} with missing imageUrl.`);
                        reject(new Error(`Missing URL for image ID ${imgData.id}`)); // Treat as error
                        return;
                    }

                    const img = new Image();
                    img.crossOrigin = 'Anonymous'; // Important for loading cross-origin images
                    img.onload = () => resolve({ id: imgData.id, img: img });
                    img.onerror = (err) => {
                        console.error(`Error loading image URL for display: ${imgData.imageUrl}`, err);
                        reject(new Error(`Failed to load image for display: ${imgData.imageUrl}`));
                    };
                    img.src = imgData.imageUrl; // <--- Load from the imageUrl
                });
            });

            Promise.all(loadPromises)
                .then(loadedResults => {
                    // Create a map of loaded HTMLImageElements keyed by their ID
                    const loadedImagesMap = new Map<string, HTMLImageElement>();
                    loadedResults.forEach(result => {
                        // Add loaded images to the map
                        loadedImagesMap.set(result.id, result.img);
                    });
                    setKonvaImages(loadedImagesMap); // Store the map
                    setIsLoadingDesign(false); // Done loading everything
                })
                .catch(error => {
                    // If any image failed to load
                    console.error("Error loading one or more design images for display:", error);
                    setKonvaImages(new Map()); // Clear loaded images on error
                    setIsLoadingDesign(false); // Stop loading
                    setErrorLoadingDesign(error.message || 'Failed to load one or more images for display.'); // Set error message
                });

        } catch (error: any) {
            // Catch error during JSON parsing
            console.error("Error parsing design data JSON for display:", error);
            setParsedDesignData(null);
            setKonvaImages(new Map()); // Clear loaded images
            setIsLoadingDesign(false);
            setErrorLoadingDesign(error.message || 'Error parsing design data for display.');
            // Ensure loadPromises is defined even if parsing fails
            loadPromises = []; // Or undefined, handled by the cleanup check
        }

        // Cleanup function: Cancel pending loads
        return () => {
            // Check if loadPromises was initialized before trying to iterate
            loadPromises?.forEach((p: Promise<{ id: string, img: HTMLImageElement }>) => { // <-- Added explicit type for p
                p.then(result => { // <-- Added explicit type for result
                    if (result.img) {
                        // Remove handlers to avoid calling state setters on unmounted component
                        result.img.onload = null;
                        result.img.onerror = null;
                        // Optionally try to stop the network request (basic attempt)
                        result.img.src = '';
                    }
                }).catch(() => { }); // Catch potential rejection during cleanup
            });
        };


    }, [designDataJson]); // Re-run effect if designDataJsonString prop changes


    // --- Render Logic ---

    // Handle loading states for the entire display component
    if (caseImageStatus === 'loading' || isLoadingDesign) { // Combine loading states
        return (
            <Box p="xl" ta="center">
                <Loader size="lg" />
                <MantineText mt="md">{caseImageStatus === 'loading' ? 'Loading Phone Case...' : 'Loading Design Elements...'}</MantineText>
            </Box>
        );
    }

    if (errorLoadingDesign || !parsedDesignData) { // Display specific error for parsing or individual design images
        return (
            <Box p="xl" ta="center">
                <Title order={2}>Error Loading Design</Title>
                <MantineText mt="sm">{errorLoadingDesign || 'Could not parse or load design data.'}</MantineText>
                {/* No button to go back here, as this component is likely nested in a page */}
            </Box>
        );
    }


    // If everything is loaded successfully, render the Konva stage
    return (
        <Stage
            width={visualWidth}
            height={visualHeight}
            listening={false}
            scaleX={0.5}
            scaleY={0.5}
        >
            {/* Background Layer */}
            <Layer>
                {/* Conditional Colored Background */}
                {showColoredBackground && caseBackgroundColor && (
                    <Rect
                        x={0}
                        y={0}
                        width={phoneCaseClip.width}
                        height={phoneCaseClip.height}
                        fill={caseBackgroundColor}
                    />
                )}
                {caseImage && (
                    <KonvaImage
                        image={caseImage}
                        width={phoneCaseClip.width}
                        height={phoneCaseClip.height}
                    />
                )}
            </Layer>

            {/* Design Elements Layer */}
            <Layer>
                {/* Render Scribbles */}
                {parsedDesignData.scribbles.map((scribble) => (
                    <Line
                        key={scribble.id}
                        points={scribble.points}
                        stroke={scribble.fillColor}
                        strokeWidth={4}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        // Position is implicitly in points, x/y can be 0
                        x={0}
                        y={0}
                    />
                ))}

                {/* Render Images from the loaded Konva Images map */}
                {/* We map over the data from the JSON to get the properties */}
                {parsedDesignData.images.map((imgData) => {
                    // Get the loaded HTMLImageElement from the map
                    const img = konvaImages.get(imgData.id);

                    // Only render the KonvaImage if the HTMLImageElement is loaded and available
                    return img ? (
                        <KonvaImage
                            key={imgData.id}
                            image={img} // Use the loaded HTMLImageElement
                            x={imgData.x}
                            y={imgData.y}
                            width={imgData.width}
                            height={imgData.height}
                            rotation={imgData.rotation} // Apply rotation
                        />
                    ) : null; // Return null if the image is not yet loaded in the map
                })}

                {/* Render Text Elements */}
                {parsedDesignData.textElements.map((text) => (
                    <Text
                        key={text.id}
                        text={text.text}
                        x={text.x}
                        y={text.y}
                        fontSize={text.fontSize}
                        fontFamily={text.fontFamily}
                        fill={text.fill}
                        rotation={text.rotation} // Apply rotation
                    />
                ))}
            </Layer>
        </Stage>

    );
}

// Dynamic import because Konva relies on the DOM
export default dynamic(() => Promise.resolve(DesignDisplay), { ssr: false });