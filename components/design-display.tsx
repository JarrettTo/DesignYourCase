'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva'; // Import Konva for types
import { Box, Button } from '@mantine/core';

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

// --- Props for the Display Component ---
interface DesignDisplayProps {
    designDataJson: LoadedDesignData; // The JSON string from your DB
    phoneModel: string; // The saved phone_model
    caseMaterial: string; // The saved case_type (material ID)
    caseStyle: string; // The saved color (style ID)
}

// <--- MAPPINGS (Copy from your Editor page) --->
// Map phone model name to its corresponding SVG path
const phoneModelSvgMapping: { [key: string]: string | undefined } = {
  // ... (Your phone model SVG paths here) ...
    'iPhone 12': '/assets/frames/iphone-12/Iphone 12.svg', // Example path
    'iPhone 12 Pro': '/assets/frames/iphone-12/Iphone 12 pro.svg',
    'iPhone 12 Pro Max': '/assets/frames/iphone-12/Iphone 12 pro max.svg',
    'iPhone 13': '/assets/frames/iphone-13/iPhone 13.svg', // Example path
    'iPhone 13 Pro': '/assets/frames/iphone-13/iPhone 13 pro.svg',
    'iPhone 13 Pro Max': '/assets/frames/iphone-13/iPhone 13 pro max.svg',
    'iPhone 14': '/assets/frames/iphone-14/iPhone 14.svg', // Example path
    'iPhone 14 Pro': '/assets/frames/iphone-14/iPhone 14 pro.svg',
    'iPhone 14 Pro Max': '/assets/frames/iphone-14/iPhone 14 pro max.svg',
    // Add all other models
};

// Map style ID to color hex code for the case background
const caseStyleColorMapping: { [key: string]: string | undefined } = {
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'black': '#000000',
    // Add all other style ID to color mappings
};

// Determine if a material should have a colored background
const materialsWithColoredBackground: string[] = [
    'silicone',
    'holo',
    'full-wrap',
    'mirror',
];
// <--- END MAPPINGS --->


// Define the canvas size (Should match or be proportional to the editor size)
const phoneCaseClip = {
    x: 0,
    y: 0,
    width: 300,
    height: 600,
};


function DesignDisplay({ designDataJson, phoneModel, caseMaterial, caseStyle }: DesignDisplayProps) {

    // State to hold the parsed design data and loaded images
    const [designData, setDesignData] = useState<LoadedDesignData | null>(null);
    const [loadedImages, setLoadedImages] = useState<{ id: string, img: HTMLImageElement, x: number, y: number, width: number, height: number, rotation?: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Loading state for parsing/images

    // Determine background elements based on props
    const phoneSvgPath = phoneModel ? phoneModelSvgMapping[phoneModel] : undefined;
    const caseBackgroundColor = caseStyle ? caseStyleColorMapping[caseStyle] : undefined;
    const showColoredBackground = caseMaterial ? materialsWithColoredBackground.includes(caseMaterial) : false;

    // Load the phone case background image
    const [caseImage] = useImage(phoneSvgPath || '');


    // Effect to parse the JSON and load images when props change
    useEffect(() => {
        if (!designDataJson) {
            setDesignData(null);
            setLoadedImages([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const parsedData = designDataJson;
            setDesignData(parsedData);

            // --- Load images asynchronously ---
            const imagePromises = parsedData.images.map(imgData => {
                return new Promise<{ id: string, img: HTMLImageElement, x: number, y: number, width: number, height: number, rotation?: number }>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve({
                        id: imgData.id,
                        img: img,
                        x: imgData.x,
                        y: imgData.y,
                        width: imgData.width,
                        height: imgData.height,
                        rotation: imgData.rotation // Include rotation
                    });
                    img.onerror = reject; // Handle load errors
                    img.src = imgData.base64; // Load from Base64 string
                });
            });

            // Wait for all images to load
            Promise.all(imagePromises)
                .then(images => {
                    setLoadedImages(images);
                    setIsLoading(false); // Done loading everything
                })
                .catch(error => {
                    console.error("Error loading images:", error);
                    // Decide how to handle image loading errors - maybe show a partial design?
                    setLoadedImages([]); // Clear images on error
                    setIsLoading(false); // Still done loading the rest
                    // Consider setting an error state to display
                });

        } catch (error) {
            console.error("Error parsing design data JSON:", error);
            setDesignData(null);
            setLoadedImages([]);
            setIsLoading(false);
            // Consider setting an error state to display
        }

    }, [designDataJson]); // Re-run effect if designDataJson prop changes


    // Render a loading state or error message if data isn't ready or invalid
    if (isLoading) {
        return <Box p="xl" ta="center">Loading Design...</Box>;
    }

    if (!designData) {
         return (
           <Box p="xl" ta="center">
               <p>Error Loading Design</p>
               <p>Could not display the design. The data might be missing or corrupted.</p>
                {/* Optional: Add a link/button to go back */}
                <Button component="a" href="/" mt="lg">Go Home</Button>
           </Box>
       );
    }

    // Render the Konva stage and layers with the loaded design elements
    return (
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
            <Stage
                width={phoneCaseClip.width}
                height={phoneCaseClip.height}
                 // Disable interaction on display stage
                listening={false}
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
                    {/* Phone Case Frame (SVG Image Overlay) */}
                    {caseImage && ( // Render only when image is loaded
                       <KonvaImage
                          image={caseImage}
                          width={phoneCaseClip.width}
                          height={phoneCaseClip.height}
                       />
                    )}
                     {/* Optional: Placeholder if case image is not loaded */}
                    {!caseImage && (
                        <Rect
                            x={0} y={0} width={phoneCaseClip.width} height={phoneCaseClip.height} fill="#e0e0e0"
                         />
                    )}
                </Layer>

                {/* Design Elements Layer */}
                <Layer>
                    {/* Render Scribbles */}
                    {designData.scribbles.map((scribble) => (
                        <Line
                            key={scribble.id}
                            points={scribble.points}
                            stroke={scribble.fillColor}
                            strokeWidth={4} // Match editor stroke width
                            tension={0.5} // Match editor tension
                            lineCap="round" // Match editor line cap
                            lineJoin="round" // Match editor line join
                             // Position is implicitly in points, x/y can be 0
                            x={0}
                            y={0}
                        />
                    ))}

                    {/* Render Loaded Images */}
                    {loadedImages.map((image) => (
                         // Use the loaded HTMLImageElement instance
                        <KonvaImage
                            key={image.id}
                            image={image.img}
                            x={image.x}
                            y={image.y}
                            width={image.width}
                            height={image.height}
                            rotation={image.rotation} // Apply rotation
                             // Konva positions based on top-left, so no need for offset here
                             // Unless you specifically saved data relative to center in the editor
                             // (Based on editor code, it seems x/y are top-left)
                        />
                    ))}

                    {/* Render Text Elements */}
                    {designData.textElements.map((text) => (
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
        </Box>
    );
}

// Dynamic import because Konva relies on the DOM
export default dynamic(() => Promise.resolve(DesignDisplay), { ssr: false });