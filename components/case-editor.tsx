'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// ... (import your icons) ...
import { IoMdDownload } from "react-icons/io";
import { FaImage } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import { GiArrowCursor } from "react-icons/gi";
import { IoMdTrash } from "react-icons/io";
import { MdOutlineTextFields } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { MdShoppingCartCheckout } from "react-icons/md";


import { useRef, useState, useEffect, useCallback } from "react"; // Added useCallback
import { v4 as uuidv4 } from "uuid";
import {
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
  Text,
  Image as KonvaImage
} from "react-konva";
import { ACTIONS } from "../constants"; // Make sure this path is correct
import useImage from 'use-image';
import Konva from 'konva';
import { Node, NodeConfig } from 'konva/lib/Node';
import { createClient } from '@supabase/supabase-js';
import { Box, Text as MantineText, Button as MantineButton, Loader } from '@mantine/core'; // Use Mantine components

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the possible types of Konva nodes we might select/interact with
type SelectableKonvaClass = 'Line' | 'Image' | 'Text'; // Konva's internal class names

// Type for the currently selected shape state
type SelectedShape = {
  id: string;
  type: SelectableKonvaClass; // <-- Use the specific Konva class names here
} | null;


// --- Design Element Data Structures (for state and JSON) ---
// These define the serializable data for each element type

type DesignShapeBase = { // Base properties for all design elements
  id: string;
  x: number;
  y: number;
  rotation?: number; // Added rotation property
};

type DesignScribble = DesignShapeBase & {
  points: number[];
  fillColor: string;
};

type DesignImageShape = DesignShapeBase & {
  width: number;
  height: number;
  imageUrl: string; // <--- Store the public URL here (crucial fix)
  // Removed image?: HTMLImageElement; and base64 properties
};

type DesignTextElement = DesignShapeBase & {
  fontSize: number;
  text: string;
  fontFamily: string;
  fill: string; // Text color (was fillColor)
};

type designDataType = {
  scribbles: DesignScribble[] | undefined;
  images: DesignImageShape[];
  textElements: DesignTextElement[];
}

// --- Saved Design Interface (Matches Supabase Schema) ---
type SavedDesign = {
  id?: string; 
  created_at?: string; 
  user_id?: string | null;
  design_data: designDataType; 
  image_url: string; 
  phone_model: string; 
  case_material: string; 
  case_style: string;
}


// <--- MAPPINGS (Define these accurately for your project) --->
// Map phone model name (from selection screen) to its corresponding SVG path
const phoneModelSvgMapping: { [key: string]: string | undefined } = {
  'iPhone 7': 'path/to/iphone7.svg', // Add actual paths for your models
  'iPhone 7 Plus': 'path/to/iphone7plus.svg',
  'iPhone 8': 'path/to/iphone8.svg',
  'iPhone 8 Plus': 'path/to/iphone8plus.svg',
  'iPhone X': 'path/to/iphoneX.svg',
  'iPhone XR': 'path/to/iphoneXR.svg',
  'iPhone XS': 'path/to/iphoneXS.svg',
  'iPhone XS Max': 'path/to/iphoneXSMax.svg',
  'iPhone 11': 'path/to/iphone11.svg',
  'iPhone 11 Pro': 'path/to/iphone11Pro.svg',
  'iPhone 11 Pro Max': 'path/to/iphone11ProMax.svg',
  'iPhone 12 mini': 'path/to/iphone12mini.svg',
  'iPhone 12': 'assets/frames/iphone-12/Iphone 12.svg', // Example path
  'iPhone 12 Pro': 'assets/frames/iphone-12/Iphone 12 pro.svg',
  'iPhone 12 Pro Max': 'assets/frames/iphone-12/Iphone 12 pro max.svg',
  'iPhone 13 mini': 'path/to/iphone13mini.svg',
  'iPhone 13': 'assets/frames/iphone-13/iPhone 13.svg', // Example path
  'iPhone 13 Pro': 'assets/frames/iphone-13/iPhone 13 pro.svg',
  'iPhone 13 Pro Max': 'assets/frames/iphone-13/iPhone 13 pro max.svg',
  'iPhone 14': 'assets/frames/iphone-14/iPhone 14.svg', // Example path
  'iPhone 14 Plus': 'path/to/iphone14plus.svg',
  'iPhone 14 Pro': 'assets/frames/iphone-14/iPhone 14 pro.svg',
  'iPhone 14 Pro Max': 'assets/frames/iphone-14/iPhone 14 pro max.svg',
  'iPhone 15': 'path/to/iphone15.svg',
  'iPhone 15 Plus': 'path/to/iphone15plus.svg',
  'iPhone 15 Pro': 'path/to/iphone15pro.svg',
  'iPhone 15 Pro Max': 'path/to/iphone15promax.svg',
  // Add mappings for Samsung, Huawei, etc. models
  'Galaxy S24': 'path/to/galaxys24.svg',
  // ... and so on for all models listed in brandModels
};

// Map style ID (from selection screen) to color hex code for the editor background
const caseStyleColorMapping: { [key: string]: string | undefined } = {
  'red': '#FF0000',
  'green': '#00FF00', // Example hex codes, use your actual colors
  'blue': '#0000FF',
  'yellow': '#FFFF00',
  // Add other style ID to color mappings
};

// Determine if a material should have a colored background
const materialsWithColoredBackground: string[] = [
  'silicone', // Assuming silicone cases have a solid color
  'holo',     // Holo might have a colored base
  'full-wrap', // Full wrap designs often cover a base color
  'mirror',   // Mirror might have a colored border or base
];
// <--- END MAPPINGS --->


// Define the canvas size (Keep fixed for now)
const phoneCaseClip = {
  x: 0,
  y: 0,
  width: 300, // Example size, adjust as needed
  height: 600, // Example size, adjust as needed
};

function sanitizeEmailForPath(email: string): string {
  // Replace '@' and '.' with underscores, and remove any other characters not safe for paths
  // Allow letters, numbers, underscores, and hyphens
  return email.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function PhoneCaseEditor() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedBrand = searchParams.get('brand');
  const selectedModel = searchParams.get('model');
  const selectedMaterial = searchParams.get('material');
  const selectedCaseStyle = searchParams.get('style');

  const [isLoading, setIsLoading] = useState(false); // State for overall loading feedback (e.g., saving)
  // State specifically for loading individual images for rendering
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);


  const stageRef = useRef<Konva.Stage>(null);
  const editLayerRef = useRef<Konva.Layer>(null);
  const backgroundLayerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  type EditorActionType = 'SELECT' | 'SCRIBBLE' | 'ADD_TEXT';
  const [action, setAction] = useState<EditorActionType>('SELECT');

  const [strokeColor, setStrokeColor] = useState<string>("#ff0000");

  const [scribbles, setScribbles] = useState<DesignScribble[]>([]);
  const [images, setImages] = useState<DesignImageShape[]>([]); // State stores objects with imageUrl
  const [textElements, setTextElements] = useState<DesignTextElement[]>([]);

  const [selectedShape, setSelectedShape] = useState<SelectedShape>(null);

  // New state to hold the *loaded* Konva Image elements (HTMLImageElement) mapped by ID
  const [konvaImages, setKonvaImages] = useState<Map<string, HTMLImageElement>>(new Map());


  // Determine phone image SVG path and background color/type based on URL params
  const phoneSvgPath = selectedModel ? phoneModelSvgMapping[selectedModel] : undefined;
  const caseBackgroundColor = selectedCaseStyle ? caseStyleColorMapping[selectedCaseStyle] : undefined;
  const showColoredBackground = selectedMaterial ? materialsWithColoredBackground.includes(selectedMaterial) : false;


  // --- Effect to load individual design images when the 'images' state changes ---
  useEffect(() => {
    // Only run if there are images defined in the state that aren't already loaded
    // Or if the list of images changes (e.g., image deleted)
    // Check if the images state changed in a way that requires re-loading Konva images
    // Simple check: If the number of images changes, or any image URL changes
    const imageListChanged = images.length !== konvaImages.size ||
      images.some(img => !konvaImages.has(img.id) || konvaImages.get(img.id)?.src !== img.imageUrl);

    if (!imageListChanged) {
      // If images state hasn't changed in a way that requires loading, just ensure loading state is off
      setIsImageLoading(false);
      return;
    }


    if (images.length === 0) {
      setKonvaImages(new Map()); // Clear loaded images if state is empty
      setIsImageLoading(false);
      setImageLoadError(null);
      return;
    }

    setIsImageLoading(true);
    setImageLoadError(null); // Clear previous loading/error state
    // Note: We don't clear konvaImages here immediately, we build a new map below

    const loadPromises = images.map(imgData => {
      // If the image is already loaded and the URL hasn't changed, use the existing loaded image
      if (konvaImages.has(imgData.id) && konvaImages.get(imgData.id)?.src === imgData.imageUrl) {
        return Promise.resolve({ id: imgData.id, img: konvaImages.get(imgData.id)! });
      }

      // Need to load this image
      return new Promise<{ id: string, img: HTMLImageElement }>((resolve, reject) => {
        if (!imgData.imageUrl) {
          console.warn(`Image data with ID ${imgData.id} is missing imageUrl.`);
          reject(new Error(`Missing URL for image ID ${imgData.id}`));
          return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Necessary for drawing cross-origin images on canvas
        img.onload = () => resolve({ id: imgData.id, img: img });
        img.onerror = (err) => {
          console.error(`Error loading image URL: ${imgData.imageUrl}`, err);
          reject(new Error(`Failed to load image: ${imgData.imageUrl}`));
        };
        img.src = imgData.imageUrl; // Start loading from the URL
      });
    });

    Promise.all(loadPromises)
      .then(loadedResults => {
        // Build the new map from scratch to ensure only images in the current 'images' state are included
        const newKonvaImages = new Map<string, HTMLImageElement>();
        loadedResults.forEach(result => {
          // Only add if the image is still in the 'images' state (could have been deleted during loading)
          if (images.some(img => img.id === result.id)) {
            newKonvaImages.set(result.id, result.img);
          }
        });
        setKonvaImages(newKonvaImages);
        setIsImageLoading(false);
      })
      .catch(error => {
        // If any image failed to load
        console.error("Error loading one or more design images:", error);
        setKonvaImages(new Map()); // Clear loaded images on error to prevent rendering broken ones
        setIsImageLoading(false);
        setImageLoadError(error.message || 'Failed to load one or more images.');
        // Decide if you want to remove failed images from state or just show error
      });

    // Cleanup function: Basic cleanup for the load/error handlers of promises
    return () => {
      loadPromises.forEach(p => {
        p.then(result => {
          if (result.img) {
            result.img.onload = null;
            result.img.onerror = null;
          }
        }).catch(() => { }); // Catch potential rejection
      });
    };

  }, [images, konvaImages]); // This effect depends on the 'images' state array AND 'konvaImages' map for checking existing loads


  // --- Helper to get the loaded HTMLImageElement from the Map ---
  const getKonvaImage = (imageId: string) => {
    return konvaImages.get(imageId);
  }


  // --- Konva/Editing Logic ---

  // Function to handle shape selection (Uses useCallback)
  const selectShape = useCallback((node: Konva.Node | null) => { /* ... (implementation from previous response) ... */
    if (transformerRef.current) { transformerRef.current.nodes([]); }
    const isBackgroundElement = node === stageRef.current || node?.id() === 'bg' || node?.id() === 'colored-background';
    if (!node || isBackgroundElement || node === transformerRef.current) {
      setSelectedShape(null); if (transformerRef.current) { transformerRef.current.nodes([]); transformerRef.current.getLayer()?.batchDraw(); } return;
    }
    const nodeKonvaClass = node.getClassName();
    let shapeType: SelectableKonvaClass | undefined;
    if (nodeKonvaClass === 'Line' && scribbles.some(s => s.id === node.id())) { shapeType = 'Line'; }
    else if (nodeKonvaClass === 'Image' && images.some(img => img.id === node.id())) { shapeType = 'Image'; }
    else if (nodeKonvaClass === 'Text' && textElements.some(txt => txt.id === node.id())) { shapeType = 'Text'; }

    if (shapeType) {
      const newlySelected: SelectedShape = { id: node.id(), type: shapeType };
      setSelectedShape(newlySelected);
      if (transformerRef.current) { transformerRef.current.nodes([node]); transformerRef.current.getLayer()?.batchDraw(); }
    } else {
      setSelectedShape(null);
      if (transformerRef.current) { transformerRef.current.nodes([]); transformerRef.current.getLayer()?.batchDraw(); }
    }
  }, [scribbles, images, textElements]); // Dependencies: state arrays used in .some()


  // Add Text Element (Uses useCallback)
  const addTextElement = useCallback(() => { /* ... (implementation from previous response) ... */
    const textId = `text-${uuidv4()}`;
    const newTextElement: DesignTextElement = { 
      id: textId, x: (phoneCaseClip.width / 2) - 50, 
      y: (phoneCaseClip.height / 2) - 12, 
      text: 'Your Text Here', 
      fontSize: 24, 
      fontFamily: 'Arial', 
      fill: strokeColor, rotation: 0 
    };
    setTextElements(prev => [...prev, newTextElement]);
    setTimeout(() => { const textNode = stageRef.current?.findOne(`#${textId}`); if (textNode) { selectShape(textNode); setAction('SELECT'); } }, 50);
  }, [selectShape, strokeColor, phoneCaseClip.width, phoneCaseClip.height]);


  // Update Text Element properties (Uses useCallback)
  const updateTextElement = useCallback((id: string, newProps: Partial<DesignTextElement>) => { /* ... (implementation from previous response) ... */
    setTextElements(prev => prev.map(text => text.id === id ? { ...text, ...newProps } : text));
  }, []);


  // Pointer Down (Remains the same, handles scribbles)
  const isPainting = useRef(false);
  const currentShapeId = useRef<string | undefined>();
  function onPointerDown() { /* ... (implementation from previous response) ... */
    if (action === 'SELECT') return;
    const stage = stageRef.current; if (!stage) return; const pointerPosition = stage.getPointerPosition(); if (!pointerPosition) return; const { x, y } = pointerPosition; const id = uuidv4();
    currentShapeId.current = id; isPainting.current = true;
    switch (action) {
      case 'SCRIBBLE':
        const newScribble: DesignScribble = {
          id: id, 
          x: 0, 
          y: 0, 
          points: [x, y], 
          fillColor: strokeColor, 
          rotation: 0 
        };
        setScribbles(prev => [...prev, newScribble]);
        break;
      default: break;
    }
  }

  // Pointer Move (Remains the same, handles scribbles)
  function onPointerMove() { /* ... (implementation from previous response) ... */
    if (action === 'SELECT' || !isPainting.current || !currentShapeId.current) return;
    const stage = stageRef.current; if (!stage) return; const pointerPosition = stage.getPointerPosition(); if (!pointerPosition) return; const { x, y } = pointerPosition;
    switch (action) {
      case 'SCRIBBLE':
        setScribbles(prev => prev.map((scribble) => { if (scribble.id === currentShapeId.current) { const newPoints = scribble.points ? [...scribble.points, x, y] : [x, y]; return { ...scribble, points: newPoints }; } return scribble; }));
        break;
      default: break;
    }
  }

  // Pointer Up (Remains the same, handles scribbles)
  function onPointerUp() { /* ... (implementation from previous response) ... */
    isPainting.current = false;
    if (action === 'SCRIBBLE' && currentShapeId.current) {
      const newLineNode = stageRef.current?.findOne(`#${currentShapeId.current}`);
      if (newLineNode) { selectShape(newLineNode); setAction('SELECT'); }
    }
    currentShapeId.current = undefined;
  }


  // Handle Export (Uses useCallback)
  const handleExport = useCallback(async () => { /* ... (implementation from previous response) ... */
    const stage = stageRef.current; if (!stage) { console.error("Stage not defined"); alert("Error exporting design: Stage not ready."); return; }
    setIsLoading(true); try {
      if (transformerRef.current) transformerRef.current.nodes([]); editLayerRef.current?.batchDraw(); await new Promise(resolve => setTimeout(resolve, 50));
      const fullStageUri = stage.toDataURL({ pixelRatio: 2 }); const fullStageBase64 = fullStageUri.split(',')[1]; const zip = new JSZip(); zip.file("full_design.png", fullStageBase64, { base64: true });
      const content = await zip.generateAsync({ type: "blob" }); saveAs(content, "design_export.zip");
    } catch (error) { console.error("Error during export:", error); alert("Failed to export design. Please try again."); } finally { setIsLoading(false); }
  }, []);


  // Handle Click (for selection/deselection - calls selectShape)
  function onClick(e: { target: any; evt: any; }) { /* ... (implementation from previous response) ... */
    if (action !== 'SELECT') { e.evt.cancelBubble = true; return; }
    const stage = stageRef.current; if (!stage) return;
    const isBackgroundElement = e.target === stage || e.target.id() === 'bg' || e.target.id() === 'colored-background';
    if (isBackgroundElement) { selectShape(null); return; }
    selectShape(e.target);
  }


  // Handle Shape Click (ensures selection even if clicks bubble - calls selectShape)
  function handleShapeClick(e: any) { /* ... (implementation from previous response) ... */
    if (action !== 'SELECT') return;
    e.cancelBubble = true; e.evt.cancelBubble = true;
    selectShape(e.target);
  }


  // Layering functions (bringForward, sendBackward - Uses useCallback)
  const bringForward = useCallback((id: string) => { /* ... (implementation from previous response) ... */
    const shape = stageRef.current?.findOne(`#${id}`);
    if (shape && shape.id() !== 'bg' && shape.id() !== 'colored-background') { shape.moveUp(); editLayerRef.current?.batchDraw(); if (selectedShape?.id === id && transformerRef.current) { transformerRef.current.nodes([shape as Konva.Node]); transformerRef.current.getLayer()?.batchDraw(); } }
  }, [selectedShape]);

  const sendBackward = useCallback((id: string) => { /* ... (implementation from previous response) ... */
    const shape = stageRef.current?.findOne(`#${id}`);
    if (shape && shape.id() !== 'bg' && shape.id() !== 'colored-background') {
      const backgroundLayer = backgroundLayerRef.current; const shapeLayer = shape.getLayer();
      if (shapeLayer && backgroundLayer && shapeLayer.getZIndex() > backgroundLayer.getZIndex()) { shape.moveDown(); editLayerRef.current?.batchDraw(); if (selectedShape?.id === id && transformerRef.current) { transformerRef.current.nodes([shape as Konva.Node]); transformerRef.current.getLayer()?.batchDraw(); } } else { console.warn("Cannot send shape backward, already at the bottom layer."); }
    }
  }, [selectedShape]);


  // Handle Delete (Uses useCallback)
  const handleDelete = useCallback(() => { /* ... (implementation from previous response) ... */
    if (selectedShape) {
      const { id, type } = selectedShape;
      if (type === 'Line') { setScribbles(prev => prev.filter((scribble) => scribble.id !== id)); }
      else if (type === 'Image') { setImages(prev => prev.filter((image) => image.id !== id)); }
      else if (type === 'Text') { setTextElements(prev => prev.filter((text) => text.id !== id)); }
      else { console.warn(`Delete not implemented for selected shape type: ${type}`); }
      if (transformerRef.current) { transformerRef.current.nodes([]); transformerRef.current.getLayer()?.batchDraw(); }
      setSelectedShape(null);
    }
  }, [selectedShape, scribbles, images, textElements]);


  // Effect to clear selection when action changes
  useEffect(() => { /* ... (implementation from previous response) ... */
    if (action !== 'SELECT' && transformerRef.current) {
      transformerRef.current.nodes([]); transformerRef.current.getLayer()?.batchDraw(); setSelectedShape(null);
    }
  }, [action]);

  // Effect for Delete key listener
  useEffect(() => { /* ... (implementation from previous response) ... */
    function handleKeyDown(e: { key: string; }) { if (e.key === "Delete" || e.key === "Backspace") { handleDelete(); } }
    window.addEventListener("keydown", handleKeyDown); return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete]);


  // Handle Image Upload (UPDATED)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true); // Use component's main loading state

    try {
      const userEmail = session?.user?.email;
      const userFolder = userEmail ? sanitizeEmailForPath(userEmail) : 'guest';
      const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const filePath = `design-images/uploaded/${userFolder}/${uuidv4()}-${safeFileName}`;

      console.log("Original Email (for folder):", userEmail);
      console.log("Sanitized Folder Name:", userFolder);
      console.log("Full Upload Path:", filePath);

      // 1. Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Supabase Image Upload Error:", uploadError);
        throw new Error("Failed to upload image: " + uploadError.message);
      }

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('phone-case-designs')
        .getPublicUrl(filePath);

      console.log("Image uploaded successfully. Public URL:", publicUrl);

      // 2. Load the image from the public URL temporarily to get its dimensions
      // This is the step that was causing the 400 error. We need to robustly handle its failure.
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = publicUrl;

        // Wait for the image to load - this promise is now the source of the 'Failed to load image from URL' error
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (err) => {
            console.error("Error loading image from URL after upload:", publicUrl, err);
            // Reject the promise with a specific error
            reject(new Error(`Failed to load image from URL: ${publicUrl}`));
          };
        });

        // If we reach here, the image loaded successfully
        const id = uuidv4();
        const maxWidth = phoneCaseClip.width * 0.8;
        const maxHeight = phoneCaseClip.height * 0.8;
        const scaledDimensions = scaleImage(img, maxWidth, maxHeight);

        // 3. Create and add the new image shape data object to state
          const newImageShape: DesignImageShape = {
          id: id,
          x: (phoneCaseClip.width - scaledDimensions.width) / 2,
          y: (phoneCaseClip.height - scaledDimensions.height) / 2,
          width: scaledDimensions.width,
          height: scaledDimensions.height,
          imageUrl: publicUrl, // Save the public URL
          rotation: 0,
        };

        setImages(prev => [...prev, newImageShape]); // Add the new image *data* object

        // 4. Select the Konva node after state updates and useEffect loads the image
        // This needs a delay because the Konva node doesn't exist until the image is loaded by the useEffect and rendered
        // The selectShape logic relies on finding the Konva node by ID in the stage.
        setTimeout(() => {
          const imageNode = stageRef.current?.findOne(`#${id}`);
          // Only attempt to select if the node exists (i.e., it was loaded by the useEffect and rendered)
          if (imageNode) {
            selectShape(imageNode); // Select the new Konva Image node
            setAction('SELECT'); // Switch back to select mode
          } else {
            console.warn(`Konva node for image ${id} not found after timeout. Image might not have loaded correctly.`);
            // Handle case where image loaded *temporarily* but failed to render or load fully later
            // You might want to remove the image from state here, or mark it as errored.
          }
          setIsLoading(false); // Hide loading after image is added/selected
        }, 100); // Increase delay slightly?

      } catch (loadError: any) {
        // Catch specifically the error from loading the image via URL after upload
        console.error("Error loading image from public URL after upload:", loadError);
        // Report this specific error to the user, using the error message from the promise rejection
        alert(`Failed to add image: ${loadError.message || 'Unknown loading error'}`);
        setIsLoading(false); // Hide loading on error
        // No need to re-throw, this catch handles the specific loading error
      }

    } catch (error: any) {
      // This catch block handles errors from the *upload* step
      console.error("Error during image upload:", error);
      alert("Failed to add image: " + (error.message || "Unknown upload error"));
      setIsLoading(false); // Hide loading on error
    } finally {
      e.target.value = ''; // Clear file input regardless of success/failure
    }
  };


  // Scale Image function (remains the same)
  function scaleImage(img: HTMLImageElement, maxWidth: number, maxHeight: number) {
    const ratioX = maxWidth / img.width;
    const ratioY = maxHeight / img.height;
    const ratio = Math.min(ratioX, ratioY);

    return {
      width: img.width * ratio,
      height: img.height * ratio
    };
  }


  const getDesignData = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) {
      console.error("Stage not defined");
      return null;
    }

    // Deselect before exporting the canvas preview
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
    editLayerRef.current?.batchDraw();
    // Add a slight delay to ensure Konva finishes rendering after deselecting
    await new Promise(resolve => setTimeout(resolve, 50));


    // Get design image as DataURL (Base64 of the entire canvas - used for preview)
    const designImageDataURL = stage.toDataURL({ pixelRatio: 2 });
    const designDataObject = {
      scribbles: scribbles.map(s => ({
        id: s.id,
        x: s.x, y: s.y,
        points: s.points,
        fillColor: s.fillColor,
        rotation: s.rotation
      })),
      images: images.map(img => ({
        id: img.id,
        x: img.x, y: img.y,
        width: img.width, height: img.height,
        rotation: img.rotation,
        imageUrl: img.imageUrl,
      })),
      textElements: textElements.map(txt => ({
        id: txt.id,
        x: txt.x, y: txt.y,
        fontSize: txt.fontSize,
        text: txt.text,
        fontFamily: txt.fontFamily,
        fill: txt.fill,
        rotation: txt.rotation
      })),
    };

    const designJSON = designDataObject; // Stringify the object

    return {
      designJSON: designJSON, // JSON string containing all elements (including image URLs)
      designImage: designImageDataURL // Base64 of the *canvas preview*
    };
  }, [scribbles, images, textElements]); // Dependencies on state arrays


  // Handle Add to Cart (Uses updated getDesignData output)
  async function handleAddToCart() { /* ... (implementation from previous response) ... */
    if (!selectedModel || !selectedMaterial || !selectedCaseStyle) { alert("Missing product selections."); return; }
    setIsLoading(true); try {
      const designData = await getDesignData(); if (!designData) throw new Error("Failed to get design data");
      const userId = session?.user?.email; // Use email as ID
      const userFolder = userId ? sanitizeEmailForPath(userId) : 'guest';
      const previewImageStoragePath = `design-previews/${userFolder}/${uuidv4()}.png`;
      const previewImageFile = await fetch(designData.designImage).then((res) => res.blob());
      const { data: previewUploadData, error: previewUploadError } = await supabase.storage.from('phone-case-designs').upload(previewImageStoragePath, previewImageFile, { cacheControl: '3600', upsert: false });
      if (previewUploadError) throw new Error("Failed to upload design preview image: " + previewUploadError.message);
      const { data: { publicUrl: previewImageUrl } } = supabase.storage.from('phone-case-designs').getPublicUrl(previewImageStoragePath);
      const savedDesign: SavedDesign = {
        user_id: userId || null,
        design_data: designData.designJSON,
        image_url: previewImageUrl,
        phone_model: selectedModel,
        case_material: selectedMaterial,
        case_style: selectedCaseStyle
      };
      const { data, error } = await supabase.from('designs').insert([savedDesign]).select();
      if (error) throw new Error("Failed to save design: " + error.message);
      console.log("Design saved:", data); alert("Design added to cart!");
    } catch (error: any) { console.error("Error adding to cart:", error); alert("Failed to add design to cart. " + (error.message || "Please try again.")); } finally { setIsLoading(false); }
  }

  // Handle Checkout Now (Remains the same)
  async function handleCheckoutNow() { /* ... (implementation from previous response) ... */
    if (!selectedModel || !selectedMaterial || !selectedCaseStyle) { alert("Missing product selections."); return; }
    setIsLoading(true); try {
      const designData = await getDesignData();
      if (!designData) throw new Error("Failed to get design data");
      const userId = session?.user?.email; // Use email as ID
      const userFolder = userId ? sanitizeEmailForPath(userId) : 'guest';
      const previewImageStoragePath = `design-previews/${userFolder}/${uuidv4()}.png`;
      const previewImageFile = await fetch(designData.designImage).then((res) => res.blob());
      const { data: previewUploadData, error: previewUploadError } = await supabase.storage.from('phone-case-designs').upload(previewImageStoragePath, previewImageFile, { cacheControl: '3600', upsert: false });
      if (previewUploadError) throw new Error("Failed to upload design preview image: " + previewUploadError.message);
      const { data: { publicUrl: previewImageUrl } } = supabase.storage.from('phone-case-designs').getPublicUrl(previewImageStoragePath);
      const savedDesign: SavedDesign = { 
        user_id: userId || null, 
        design_data: designData.designJSON, 
        image_url: previewImageUrl, 
        phone_model: selectedModel, 
        case_material: selectedMaterial, 
        case_style: selectedCaseStyle 
      };
      const { data, error } = await supabase.from('designs').insert([savedDesign]).select();
      if (error) throw new Error("Failed to save design: " + error.message);
      console.log("Design saved for checkout:", data[0]); router.push(`/checkout?designId=${data[0].id}`);
    } catch (error: any) { console.error("Error proceeding to checkout:", error); alert("Failed to proceed to checkout. " + (error.message || "Please try again.")); } finally { setIsLoading(false); }
  }


  // Basic check to see if parameters are available for initial render
  if (!selectedModel || !selectedMaterial || !selectedCaseStyle) {
    useEffect(() => {
      // Redirect only if not loading and parameters are missing
      // Check isLoading and isImageLoading
      if (!isLoading && !isImageLoading && (!selectedModel || !selectedMaterial || !selectedCaseStyle)) {
        console.warn("Missing parameters, redirecting to selection page.");
        router.replace('/'); // Adjust '/' to the path of your selection page
      }
      // Add imageLoadError as a dependency? Redirect on initial load error? Depends on desired behavior.
    }, [selectedModel, selectedMaterial, selectedCaseStyle, router, isLoading, isImageLoading]);

    // While redirecting or waiting for useEffect, show a message
    return (
      <Box p="xl" ta="center">
        <MantineText size="xl" fw={700}>Preparing Editor...</MantineText>
        <MantineText mt="sm">Redirecting to product selection...</MantineText>
        <Loader mt="md" />
      </Box>
    );
  }

  // If parameters are present, determine paths and colors for rendering
  const phoneSvgPathForRendering = selectedModel ? phoneModelSvgMapping[selectedModel] : undefined;
  const caseBackgroundColorForRendering = selectedCaseStyle ? caseStyleColorMapping[selectedCaseStyle] : undefined;
  const showColoredBackgroundForRendering = selectedMaterial ? materialsWithColoredBackground.includes(selectedMaterial) : false;

  // Load the phone case background image using useImage
  const [caseImageForRendering, caseImageStatus] = useImage(phoneSvgPathForRendering || '');

  // If the case image is loading or failed to load, or if *any* individual design image is loading, show loading state
  if (caseImageStatus === 'loading' || isImageLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader size="lg" />
        <MantineText mt="md">{caseImageStatus === 'loading' ? 'Loading Phone Case...' : 'Loading Design Images...'}</MantineText>
      </Box>
    );
  }

  // If *any* individual design image failed to load after the initial case image loaded
  if (imageLoadError) {
    return (
      <Box p="xl" ta="center">
        <MantineText size="xl" fw={700} color="red">Error Loading Design Images</MantineText>
        <MantineText mt="sm">{imageLoadError}</MantineText>
        {/* Decide how to handle this - maybe allow them to proceed with missing images? */}
        {/* For now, just show the error */}
        {/* You might want a retry button here */}
      </Box>
    );
  }


  return (
    <div>
      <div className="relative w-full h-screen overflow-hidden">
        {/* Tool bar at the top */}
        <div className="absolute top-0 z-10 w-full py-2 ">
          {/* ... (Your toolbar buttons remain the same) ... */}
          <div className="flex justify-center items-center gap-3 py-2 px-3 w-fit mx-auto border shadow-lg rounded-lg bg-white">
            {/* Select Tool */}
            <button className={action === 'SELECT' ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"} onClick={() => setAction('SELECT')} aria-label="Select Tool"> <GiArrowCursor size={"2rem"} /> </button>
            {/* Pencil Tool */}
            <button className={action === 'SCRIBBLE' ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"} onClick={() => setAction('SCRIBBLE')} aria-label="Pencil Tool"> <LuPencil size={"2rem"} /> </button>
            {/* Add Text */}
            <button className="p-1 hover:bg-violet-100 rounded" onClick={addTextElement} aria-label="Add Text"> <MdOutlineTextFields size={"2rem"} /> </button>
            {/* Color Picker */}
            <button aria-label="Choose Shape Color"> <input className="w-6 h-6 rounded-md border-0" type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} /> </button> {/* Use strokeColor state */}
            {/* Image Upload */}
            {/* Disable upload button while overall saving/uploading or while individual images are loading */}
            <button aria-label="Upload Image" disabled={isLoading || isImageLoading}>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload" />
              {/* Apply disabled class conditionally */}
              <label htmlFor="image-upload" className={`p-1 rounded cursor-pointer ${(isLoading || isImageLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-violet-100'}`}>
                <FaImage size={"2rem"} />
              </label>
            </button>
            {/* Delete Selected */}
            <button className="p-1 hover:bg-red-100 rounded" onClick={handleDelete} disabled={!selectedShape} aria-label="Delete Selected Item"> <IoMdTrash size={"2rem"} /> </button>
            {/* Export */}
            <button className="p-1 hover:bg-violet-100 rounded" onClick={() => handleExport().catch(console.error)} aria-label="Download Design" disabled={isLoading} > <IoMdDownload size={"2rem"} /> </button>

            {/* Add to Cart / Checkout Buttons (Desktop) */}
            <div className='max-md:hidden flex items-center border-l border-gray-200 ml-3 pl-3'>
              <button className="p-1 hover:bg-violet-100 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAddToCart} disabled={isLoading}> <FaShoppingCart size={"1.5rem"} className="mr-2" /> {isLoading ? "Adding..." : "Add to Cart"} </button>
              <button className="p-1 hover:bg-violet-100 rounded flex items-center ml-2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleCheckoutNow} disabled={isLoading}> <MdShoppingCartCheckout size={"1.5rem"} className="mr-2" /> {isLoading ? "Processing..." : "Checkout Now"} </button>
            </div>
          </div>
        </div>
        {/* Add to Cart / Checkout Buttons (Mobile - bottom right) */}
        <div className='max-md:flex hidden bottom-5 z-20 right-5 absolute gap-2 bg-white p-3 rounded-lg shadow-lg'>
          <button className="p-1 hover:bg-violet-100 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAddToCart} disabled={isLoading}> <FaShoppingCart size={"1.5rem"} className="mr-2" /> {isLoading ? "Adding..." : "Cart"} </button>
          <button className="p-1 hover:bg-violet-100 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleCheckoutNow} disabled={isLoading}> <MdShoppingCartCheckout size={"1.5rem"} className="mr-2" /> {isLoading ? "..." : "Buy"} </button>
        </div>

        {/* Konva Stage */}
        <div className='flex justify-center items-center w-full h-full pt-20'>
          <Stage
            width={phoneCaseClip.width} height={phoneCaseClip.height} ref={stageRef}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onClick}
          >
            {/* Background Layer */}
            <Layer ref={backgroundLayerRef}>
              {/* ... (Colored Background and Phone Case Frame remain the same) ... */}
              {showColoredBackgroundForRendering && caseBackgroundColorForRendering && (
                <Rect id="colored-background" x={0} y={0} width={phoneCaseClip.width} height={phoneCaseClip.height} fill={caseBackgroundColorForRendering} listening={false} />
              )}
              {/* caseImageForRendering is already checked for loading status before returning the main JSX */}
              {phoneSvgPathForRendering && caseImageForRendering && (
                <KonvaImage id="bg" image={caseImageForRendering} width={phoneCaseClip.width} height={phoneCaseClip.height} listening={false} />
              )}
            </Layer>

            {/* Editing Layer (Shapes, Images, Text) */}
            <Layer ref={editLayerRef}>
              {/* Scribbles */}
              {scribbles.map((scribble) => (
                <Line
                  key={scribble.id} id={scribble.id} points={scribble.points} stroke={scribble.fillColor}
                  strokeWidth={4} tension={0.5} lineCap="round" lineJoin="round"
                  draggable={action === 'SELECT'}
                  onClick={handleShapeClick} onTap={handleShapeClick}
                  rotation={scribble.rotation}
                />
              ))}
              {/* Uploaded Images (Render by getting loaded HTMLImageElement from map) */}
              {images.map((image) => {
                // Use the helper to get the loaded HTMLImageElement from the map
                const img = getKonvaImage(image.id);

                // If img is available, render the KonvaImage.
                // If img is not available, it means it's still loading or failed.
                // Overall image loading status is handled at the top of the component.
                // We can render a placeholder here if desired, but returning null is simpler.
                return img ? (
                  <KonvaImage
                    key={image.id} id={image.id} image={img} // Use the loaded image element
                    x={image.x} y={image.y} width={image.width} height={image.height} rotation={image.rotation}
                    draggable={action === 'SELECT'}
                    onClick={handleShapeClick} onTap={handleShapeClick}
                    onDragEnd={(e) => { setImages(prevImages => prevImages.map(img => img.id === image.id ? { ...img, x: e.target.x(), y: e.target.y() } : img)); }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX(); const scaleY = node.scaleY();
                      const newWidth = Math.max(5, node.width() * scaleX); const newHeight = Math.max(5, node.height() * scaleY);
                      const newRotation = node.rotation();
                      node.scaleX(1); node.scaleY(1); // Reset scale after transform
                      setImages(prevImages => prevImages.map(img => img.id === image.id ? { ...img, x: node.x(), y: node.y(), width: newWidth, height: newHeight, rotation: newRotation } : img));
                    }}
                  />
                ) : null; // Return null if the image is not yet in the konvaImages map
              })}
              {/* Text Elements */}
              {textElements.map(text => (
                <Text
                  key={text.id} id={text.id} text={text.text} x={text.x} y={text.y}
                  fontSize={text.fontSize} fontFamily={text.fontFamily} fill={text.fill} rotation={text.rotation}
                  draggable={action === 'SELECT'}
                  onClick={handleShapeClick} onTap={handleShapeClick}
                  onDblClick={() => { if (action === 'SELECT') { const newText = prompt('Edit Text:', text.text); if (newText !== null) updateTextElement(text.id, { text: newText }); } }}
                  onDblTap={() => { if (action === 'SELECT') { const newText = prompt('Edit Text:', text.text); if (newText !== null) updateTextElement(text.id, { text: newText }); } }}
                  onDragEnd={(e) => { updateTextElement(text.id, { x: e.target.x(), y: e.target.y() }); }}
                  onTransformEnd={(e) => {
                    const node = e.target; const scaleY = node.scaleY();
                    const newFontSize = Math.max(5, text.fontSize * scaleY); const newRotation = node.rotation();
                    node.scaleX(1); node.scaleY(1);
                    updateTextElement(text.id, { x: node.x(), y: node.y(), fontSize: newFontSize, rotation: newRotation });
                  }}
                />
              ))}
              {/* Transformer */}
              <Transformer
                ref={transformerRef} rotateEnabled={true} resizeEnabled={true}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                boundBoxFunc={(oldBox, newBox) => { if (newBox.width < 5 || newBox.height < 5) return oldBox; return newBox; }}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

// Use dynamic import with ssr: false
export default dynamic(() => Promise.resolve(PhoneCaseEditor), { ssr: false });