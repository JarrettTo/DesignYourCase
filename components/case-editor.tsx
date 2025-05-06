'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { IoMdDownload } from "react-icons/io";
import { FaImage } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import { GiArrowCursor } from "react-icons/gi";
import { IoMdTrash } from "react-icons/io";
import { MdOutlineTextFields } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { MdShoppingCartCheckout } from "react-icons/md";
import { useRef, useState, useEffect } from "react";
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
import { Box } from '@mantine/core';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for the shapes and actions (These remain the same)
type ShapeType = 'RECTANGLE' | 'CIRCLE' | 'ARROW' | 'SCRIBBLE' | 'TEXT';
type Shape = {
    id: string;
    x: number;
    y: number;
    fillColor: string; // Used for scribble stroke/text fill
    width?: number; // For images
    height?: number; // For images
    radius?: number;
    points?: number[]; // For scribbles
    image?: HTMLImageElement; // For images
};

type SelectedShape = {
    id: string;
    type: string;
} | null;

type TextElement = {
  id: string;
  x: number;
  y: number;
  fontSize: number;
  text: string;
  fontFamily: string;
  fill: string;
}

type SavedDesign = {
  id?: string;
  user_id?: string;
  design_data: string;
  image_url: string;
  phone_model: string; // Store model name
  case_material: string; // Store material name or ID
  case_style: string; // Store style name or ID (e.g., color name)
  created_at?: string;
}

// <--- NEW MAPPINGS --->
// Map phone model name to its corresponding SVG path
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
// <--- END NEW MAPPINGS --->


// Remove props from the function signature
function PhoneCaseEditor(/* No props here anymore */) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params hook

  // <--- Read parameters from the URL --->
  const selectedBrand = searchParams.get('brand');
  const selectedModel = searchParams.get('model');
  const selectedMaterial = searchParams.get('material'); // e.g., 'clear', 'silicone'
  const selectedCaseStyle = searchParams.get('style'); // e.g., 'red', 'green'
  // <--- END Reading parameters --->

  // State for loading feedback during checkout/add to cart
  const [isLoading, setIsLoading] = useState(false);

  const stageRef = useRef<Konva.Stage>(null);
  const editLayerRef = useRef<Konva.Layer>(null);
  const backgroundLayerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [action, setAction] = useState<ShapeType | string>(ACTIONS.SELECT);
  const [fillColor, setFillColor] = useState<string>("#ff0000"); // Default color for new shapes
  const [scribbles, setScribbles] = useState<Shape[]>([]);
  const [images, setImages] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<SelectedShape>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null); // Redundant? selectedShape seems enough
  const [textElements, setTextElements] = useState<TextElement[]>([]);

  // <--- Determine phone image SVG path and background color/type --->
  const phoneSvgPath = selectedModel ? phoneModelSvgMapping[selectedModel] : undefined;
  const caseBackgroundColor = selectedCaseStyle ? caseStyleColorMapping[selectedCaseStyle] : undefined; // Get hex color from style ID
  const showColoredBackground = selectedMaterial ? materialsWithColoredBackground.includes(selectedMaterial) : false;
  // <--- END Determination --->


  // Use the determined SVG path to load the phone case image
  // useImage will return undefined or null if phoneSvgPath is undefined or loading
  const [caseImage] = useImage(phoneSvgPath || ''); // Pass empty string if path is undefined

  const strokeColor = "#000"; // Default stroke color for scribbles
  const isPainting = useRef(false);
  const currentShapeId = useRef<string | undefined>();
  const isDraggable = action === ACTIONS.SELECT; // Shapes are draggable only in select mode

  // Define the canvas size (You might want to make this responsive or based on model)
  // For now, keep it fixed as it was
  const phoneCaseClip = {
      x: 0,
      y: 0,
      width: 300,
      height: 600,
  };

  // Function to handle shape selection (remains the same)
  const selectShape = (node: Konva.Node | null) => {
    // Clear previous selection
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }

    // Deselect if clicking stage, background, or transformer itself
    // Check if node exists and is not the background image node ('bg')
    if (!node || node.id() === 'bg' || node.id() === 'colored-background' || node === transformerRef.current) {
      setSelectedShape(null);
      setSelectedImageId(null); // Keep this if needed elsewhere, though selectedShape type should cover it
      return;
    }

    // Set the selected shape state
    setSelectedShape({
      id: node.id(),
      type: node.getClassName(), // Get Konva node type (Line, Image, Text, Rect, etc.)
    });

    // Attach transformer to the node
    if (transformerRef.current) {
      transformerRef.current.nodes([node]);
      // Batch draw might not be necessary here, selectShape is often called inside onClick
      // which is already part of a draw cycle. But leaving it doesn't hurt.
      transformerRef.current.getLayer()?.batchDraw();
    }
  };

  // Add Text Element (remains the same, but ensures it's selected)
  const addTextElement = () => {
      const textId = `text-${uuidv4()}`;
      const newTextElement: TextElement = {
          id: textId,
          x: 50, // Default position
          y: 50, // Default position
          text: 'Sample Text',
          fontSize: 24, // Default font size
          fontFamily: 'Arial', // Default font
          fill: '#000000', // Default text color
      };
      setTextElements([...textElements, newTextElement]);

      // Select the new text element after it's added and rendered
      // Use a timeout to allow React state update and Konva rendering
      setTimeout(() => {
        const textNode = stageRef.current?.findOne(`#${textId}`);
        if (textNode) { // Check if node exists
             selectShape(textNode);
        }
      }, 50); // Short delay
  };

  // Update Text Element (remains the same)
  const updateTextElement = (id: string, newProps: Partial<TextElement>) => {
      setTextElements(textElements.map(text => text.id === id ? { ...text, ...newProps } : text));
      // Keep transformer attached if the selected shape is the updated text element
      if (selectedShape?.id === id && transformerRef.current) {
           const updatedNode = stageRef.current?.findOne(`#${id}`);
           if (updatedNode) transformerRef.current.nodes([updatedNode]);
      }
  };

  // Pointer Down (remains the same, only handles SCRIBBLE currently)
  function onPointerDown() {
    if (action === ACTIONS.SELECT) return;

    const stage = stageRef.current;
    if (!stage) return console.log("Stage not defined");
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;
    const { x, y } = pointerPosition;
    const id = uuidv4();

    currentShapeId.current = id;
    isPainting.current = true;

    switch (action) {
      case ACTIONS.SCRIBBLE:
        setScribbles((scribbles) => [
          ...scribbles,
          {
            id,
            x,
            y,
            points: [x, y],
            fillColor, // Using fillColor for scribble stroke
          },
        ]);
        break;
      default:
        break;
    }
  }

  // Pointer Move (remains the same, only handles SCRIBBLE currently)
  function onPointerMove() {
    if (action === ACTIONS.SELECT || !isPainting.current) return;

    const stage = stageRef.current;
    if (!stage) return console.log("Stage not defined");
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;
    const { x, y } = pointerPosition;

    switch (action) {
      case ACTIONS.SCRIBBLE:
              setScribbles((scribbles) =>
                scribbles.map((scribble) => {
                  if (scribble.id === currentShapeId.current) {
                    // Append points if they exist, otherwise start with current point
                    const newPoints = scribble.points ? [...scribble.points, x, y] : [x, y];
                    return {
                      ...scribble,
                      points: newPoints,
                    };
                  }
                  return scribble;
                })
              );
              break;
      default:
        break;
    }
  }

  // Pointer Up (remains the same)
  function onPointerUp() {
    isPainting.current = false;
    // After painting a scribble, potentially select it
    if (action === ACTIONS.SCRIBBLE && currentShapeId.current) {
         const newLineNode = stageRef.current?.findOne(`#${currentShapeId.current}`);
         if(newLineNode) {
            selectShape(newLineNode);
            setAction(ACTIONS.SELECT); // Switch back to select after drawing
         }
    }
    currentShapeId.current = undefined;
  }

  // Handle Export (remains mostly the same, corrected use of async)
  async function handleExport() {
    const stage = stageRef.current;
    if (!stage) {
       console.error("Stage not defined");
       alert("Error exporting design: Stage not ready.");
       return;
    }

    setIsLoading(true); // Show loading state during export
    try {
      // Create a zip file
      const zip = new JSZip();

      // Ensure transformer is detached before exporting the full stage
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      editLayerRef.current?.batchDraw(); // Redraw layer without transformer

      // Export the full stage as an image
      // Adding a slight delay might help ensure the transformer is gone
      await new Promise(resolve => setTimeout(resolve, 50));

      const fullStageUri = stage.toDataURL({ pixelRatio: 2 }); // Optional: export higher resolution
      const fullStageBase64 = fullStageUri.split(',')[1];
      zip.file("full_design.png", fullStageBase64, {base64: true});

      // You can uncomment and refine the individual shape export logic if needed,
      // but exporting the full stage is usually sufficient for the final design image.
      /*
      // Function to export a single node as PNG (simplified)
      const exportNodeAsPNG = (node: Node<NodeConfig>) => {
        // This is complex as it requires isolating the node and potentially
        // its context. Exporting the full canvas and cropping might be easier
        // or just exporting the final design image.
        // For simplicity, sticking to full design image export.
        return Promise.resolve(''); // Placeholder
      };

      // Helper function to export shapes
      const exportShapes = async (shapes: any[], shapeType: string) => {
        // Logic removed for simplicity, as full design is exported
      };
      // await exportShapes(scribbles, 'scribble');
      // await exportShapes(images, 'image');
      // await exportShapes(textElements, 'text');
      */


      // Generate the zip file
      const content = await zip.generateAsync({type: "blob"});

      // Save the zip file
      saveAs(content, "design_export.zip");

    } catch (error) {
       console.error("Error during export:", error);
       alert("Failed to export design. Please try again.");
    } finally {
       setIsLoading(false); // Hide loading state
    }
  }

  // Handle Click (remains the same, selects shapes)
  function onClick(e: { target: any; evt: any; }) {
    // Prevent click on stage when drawing
     if (action !== ACTIONS.SELECT) {
         // If drawing, stop event propagation on stage click to prevent selection logic
         e.evt.cancelBubble = true;
         return;
     }

    // Get the clicked shape
    const shape = e.target;

    // If clicking on the stage or background, deselect
    if (shape === stageRef.current || shape.id() === 'bg' || shape.id() === 'colored-background') {
      selectShape(null);
      return;
    }

    // Prevent event bubbling for shapes (redundant if handleShapeClick is used?)
    // e.evt.cancelBubble = true; // Might not be needed if handleShapeClick is used

    // If a shape was clicked that is not the background, select it
    selectShape(shape);
  }

  // Handle Shape Click (Used on individual shape components, ensures selection)
  function handleShapeClick(e: any) {
    if (action !== ACTIONS.SELECT) return;

    // Prevent event bubbling to avoid selecting/deselecting conflicts with stage onClick
    e.cancelBubble = true; // Konva event bubbling
    e.evt.cancelBubble = true; // DOM event bubbling

    // Select the shape that triggered this event
    selectShape(e.target);
  }

  // Layering functions (remains the same)
  function bringForward(id: string) {
    const shape = stageRef.current?.findOne(`#${id}`);
    shape?.moveUp();
    editLayerRef.current?.batchDraw(); // Redraw the layer to reflect the change
    if (transformerRef.current) { // Keep transformer attached to the moved node
        transformerRef.current.nodes([shape as Konva.Node]); // Cast is needed as findOne can return Node | undefined
        transformerRef.current.getLayer()?.batchDraw();
    }
  }

  function sendBackward(id: string) {
    const shape = stageRef.current?.findOne(`#${id}`);
     // Prevent sending background elements below the background layers
    if (shape && shape.id() !== 'bg' && shape.id() !== 'colored-background') {
        shape.moveDown();
        editLayerRef.current?.batchDraw();
        if (transformerRef.current) { // Keep transformer attached
            transformerRef.current.nodes([shape as Konva.Node]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }
  }


  // Handle Delete (remains mostly the same, ensures correct state update and transformer clear)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleDelete() {
    if (selectedShape) {
      const { id, type } = selectedShape;

      switch (type) {
        case 'Line': // Scribbles are Konva.Line
          setScribbles((prevScribbles) =>
            prevScribbles.filter((scribble) => scribble.id !== id)
          );
          break;
        case 'Image': // Uploaded images are Konva.Image
          setImages((prevImages) =>
            prevImages.filter((image) => image.id !== id)
          );
          break;
        case 'Text': // Text elements are Konva.Text
          setTextElements((prevTexts) =>
            prevTexts.filter((text) => text.id !== id)
          );
          break;
        // Add cases for other Konva types if you add them (e.g., Rect, Circle)
        // case 'Rect':
        // case 'Circle':
        default:
           console.warn(`Delete not implemented for shape type: ${type}`);
          break;
      }

      // Clear selection and transformer after deleting the node
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      setSelectedShape(null);
      setSelectedImageId(null); // Redundant? Remove if not used elsewhere
    }
  }

  // Effect to clear selection when action changes (remains the same)
  useEffect(() => {
    if (action !== ACTIONS.SELECT && transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
      setSelectedShape(null);
      setSelectedImageId(null);
    }
  }, [action]); // Depend on action change

  // Effect for Delete key listener (remains the same, but ensures handleDelete is stable)
  useEffect(() => {
    // Create a stable reference to handleDelete
    const stableHandleDelete = () => handleDelete(); // Call the state-dependent handleDelete

    function handleKeyDown(e: { key: string; }) {
      if (e.key === "Delete" || e.key === "Backspace") {
        stableHandleDelete();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // Add selectedShape and selectedImageId as dependencies if handleDelete directly uses them
    // The stableHandleDelete approach captures the state at the time of effect creation.
    // If handleDelete needs the *latest* state, add them as dependencies.
    // Given handleDelete uses state setters (setScribbles, etc.), it likely needs the latest state implicitly,
    // but react-hooks/exhaustive-deps might complain without adding them. Let's add for correctness.
  }, [selectedShape, selectedImageId, handleDelete]); // Add dependencies for handleDelete's closure

  // Remove handleModelSelect as model is now from params
  // const handleModelSelect = (model: any) => { setPhoneModel(model); };

  // Handle Image Upload (remains the same, adds selecting the uploaded image)
  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0]; // Use optional chaining
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      if (event.target?.result) { // Use optional chaining
        img.src = event.target.result as string;
      }

      img.onload = () => {
        const id = uuidv4();
        // Define max dimensions relative to the canvas size
        const maxWidth = phoneCaseClip.width * 0.8;
        const maxHeight = phoneCaseClip.height * 0.8;

        const scaledDimensions = scaleImage(img, maxWidth, maxHeight);

        const newImage = {
            id,
            // Position image at the center of the clipping area
            x: (phoneCaseClip.width - scaledDimensions.width) / 2,
            y: (phoneCaseClip.height - scaledDimensions.height) / 2,
            width: scaledDimensions.width,
            height: scaledDimensions.height,
            image: img,
            fillColor: fillColor, // Not strictly used for image fill, but might be for borders etc.
          };

        setImages((prevImages) => [ ...prevImages, newImage ]);

        // Select the new image after it's added and rendered
        setTimeout(() => {
          const imageNode = stageRef.current?.findOne(`#${id}`);
          if (imageNode) {
            selectShape(imageNode);
          }
        }, 50); // Short delay
      };

      img.onerror = () => {
        console.error("Error loading the image");
        alert("Failed to load image for upload.");
      };
    };

    reader.readAsDataURL(file);
     // Clear the file input so the same file can be selected again
    e.target.value = '';
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

  // Helper function to get design JSON and image data (remains the same)
  async function getDesignData() {
    const stage = stageRef.current;
    if (!stage) {
      console.error("Stage not defined");
      return null;
    }

     // Ensure transformer is removed before export
     if (transformerRef.current) {
        transformerRef.current.nodes([]);
     }
     editLayerRef.current?.batchDraw();
     await new Promise(resolve => setTimeout(resolve, 50)); // Small delay

    // Get design image as DataURL (higher resolution for better quality)
    const designImageDataURL = stage.toDataURL({ pixelRatio: 2 });

    // Prepare design data JSON
    const imagesWithBase64 = images.map(image => {
      const base64 = image.image ? image.image.src : '';
      return {
        ...image,
        base64,
        image: undefined // Remove the image object as it can't be serialized
      };
    });

    const designData = {
      scribbles,
      images: imagesWithBase64,
      textElements
    };

    return {
      designJSON: JSON.stringify(designData),
      designImage: designImageDataURL
    };
  }

  // Handle Add to Cart (Updated to use URL parameters)
  async function handleAddToCart() {
    // Basic validation for required parameters
    if (!selectedModel || !selectedMaterial || !selectedCaseStyle) {
        alert("Missing product selections. Please go back and select phone model, material, and style.");
        return;
    }

    setIsLoading(true);
    try {
      const designData = await getDesignData();
      if (!designData) {
        throw new Error("Failed to get design data");
      }

      // Get the current user (or guest ID if not logged in)
      // Using supabase.auth.getUser is more reliable than useSession data for Supabase auth
      const userId = session?.user?.email

      // Determine storage path - use user ID if available, otherwise a temporary path
      const storagePath = userId ? `designs/${userId}/${uuidv4()}.png` : `guest-designs/${uuidv4()}.png`;


      // 1. Upload the image to Supabase Storage
      const imageFile = await fetch(designData.designImage).then((res) => res.blob());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('phone-case-designs') // Ensure this bucket exists in Supabase
        .upload(storagePath, imageFile, {
             cacheControl: '3600', // Optional: Cache for 1 hour
             upsert: false // Do not overwrite if file exists (shouldn't happen with uuid)
        });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        throw new Error("Failed to upload design image: " + uploadError.message);
      }

      // Get the public URL for the uploaded image
      // Note: Row Level Security (RLS) on the storage bucket must allow public read or signed URLs if private
      const { data: { publicUrl } } = supabase.storage
        .from('phone-case-designs')
        .getPublicUrl(storagePath);

      // 2. Save the design data to the database
      const savedDesign: SavedDesign = {
        user_id: userId || undefined,
        design_data: designData.designJSON,
        image_url: publicUrl,
        phone_model: selectedModel, // Save the selected model name
        case_material: selectedMaterial, // Save the selected material ID
        case_style: selectedCaseStyle // Save the selected style ID (color name)
      };

      const { data, error } = await supabase
        .from('designs') // Ensure this table exists in Supabase with the correct columns
        .insert(savedDesign)
        .select(); // Select the inserted data to get the ID

      if (error) {
        console.error("Supabase DB Insert Error:", error);
        throw new Error("Failed to save design: " + error.message);
      }

       console.log("Design saved:", data);


      // 3. Handle success (e.g., show confirmation or redirect)
      alert("Design added to cart!"); // Simple alert
      // Optional: Redirect to a cart/dashboard page
      // router.push('/dashboard');

    } catch (error) {
      console.error("Error adding to cart:", error);
      // More user-friendly error message
      alert("Failed to add design to cart. " + (error instanceof Error ? error.message : 'Please try again.'));
    } finally {
      setIsLoading(false); // Hide loading state
    }
  }

  // Handle Checkout Now (Similar to Add to Cart, but redirects to checkout page)
  async function handleCheckoutNow() {
     // Basic validation for required parameters
     if (!selectedModel || !selectedMaterial || !selectedCaseStyle) {
        alert("Missing product selections. Please go back and select phone model, material, and style.");
        return;
    }

    setIsLoading(true);
    try {
      const designData = await getDesignData();
      if (!designData) {
        throw new Error("Failed to get design data");
      }

      // Get the current user (or guest ID if not logged in)
      const userId = session?.user?.email

       const storagePath = userId ? `designs/${userId}/${uuidv4()}.png` : `guest-designs/${uuidv4()}.png`;


      // 1. Upload the image to Supabase Storage
      const imageFile = await fetch(designData.designImage).then((res) => res.blob());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(storagePath, imageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        throw new Error("Failed to upload design image: " + uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('phone-case-designs')
        .getPublicUrl(storagePath);

      // 2. Save the design data to the database
      const savedDesign: SavedDesign = {
        user_id: userId || undefined,
        design_data: designData.designJSON,
        image_url: publicUrl,
        phone_model: selectedModel,
        case_material: selectedMaterial,
        case_style: selectedCaseStyle
      };

      const { data, error } = await supabase
        .from('designs')
        .insert(savedDesign)
        .select();

      if (error) {
        console.error("Supabase DB Insert Error:", error);
        throw new Error("Failed to save design: " + error.message);
      }

      // 3. Redirect to checkout with the design ID
      if (data && data[0]) {
        router.push(`/checkout?designId=${data[0].id}`);
      } else {
        throw new Error("Design was saved but no ID was returned");
      }
    } catch (error) {
      console.error("Error proceeding to checkout:", error);
       alert("Failed to proceed to checkout. " + (error instanceof Error ? error.message : 'Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  // Basic check to see if parameters are available (optional, but good practice)
   if (!selectedModel || !selectedMaterial || !selectedCaseStyle || !phoneSvgPath || !caseBackgroundColor) {
       // You could render a loading state, an error message, or redirect back
       // For now, just return a simple message.
       // Consider adding a more robust check and redirect in a useEffect.
       // useEffect(() => { if (!selectedModel || ...) { router.push('/'); } }, [selectedModel, ...]);
       return (
           <Box p="xl" ta="center">
               <Text size="xl" fw={700}>Loading Editor...</Text>
               {!selectedModel && <Text>Missing phone model in URL.</Text>}
               {!selectedMaterial && <Text>Missing case material in URL.</Text>}
               {!selectedCaseStyle && <Text>Missing case style in URL.</Text>}
               {!phoneSvgPath && selectedModel && <Text>Could not find SVG for model: {selectedModel}</Text>}
               {!caseBackgroundColor && selectedCaseStyle && <Text>Could not find color for style: {selectedCaseStyle}</Text>}
           </Box>
       );
   }


  return (
    <div>
      <div className="relative w-full h-screen overflow-hidden">
        {/* Tool bar at the top */}
        <div className="absolute top-0 z-10 w-full py-2 ">
          <div className="flex justify-center items-center gap-3 py-2 px-3 w-fit mx-auto border shadow-lg rounded-lg bg-white"> {/* Added bg-white for visibility */}
            {/* Select Tool */}
            <button
              className={
                action === ACTIONS.SELECT
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => setAction(ACTIONS.SELECT)}
              aria-label="Select Tool"
            >
              <GiArrowCursor size={"2rem"} />
            </button>
            {/* Pencil Tool */}
            <button
              className={
                action === ACTIONS.SCRIBBLE
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => setAction(ACTIONS.SCRIBBLE)}
               aria-label="Pencil Tool"
            >
              <LuPencil size={"2rem"} />
            </button>
            {/* Add Text */}
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={addTextElement}
              aria-label="Add Text"
            >
              <MdOutlineTextFields size={"2rem"}/>
            </button>
            {/* Color Picker */}
            <button aria-label="Choose Shape Color">
              <input
                className="w-6 h-6 rounded-md border-0" // Added some styles
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
              />
            </button>
            {/* Image Upload */}
            <button aria-label="Upload Image">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload" className='p-1 hover:bg-violet-100 rounded cursor-pointer'>
                <FaImage size={"2rem"} />
              </label>
            </button>
             {/* Delete Selected */}
            <button
              className="p-1 hover:bg-red-100 rounded" // Use red for delete
              onClick={handleDelete}
              disabled={!selectedShape} // Disable if nothing is selected
              aria-label="Delete Selected Item"
            >
              <IoMdTrash size={"2rem"} />
            </button>
             {/* Export */}
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={() => handleExport().catch(console.error)} // Handle promise
              aria-label="Download Design"
              disabled={isLoading} // Disable while saving
            >
              <IoMdDownload size={"2rem"} />
            </button>

            {/* Add to Cart / Checkout Buttons (Desktop) */}
            <div className='max-md:hidden flex items-center border-l border-gray-200 ml-3 pl-3'> {/* Added border for separation */}
              <button
                className="p-1 hover:bg-violet-100 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed" // Add disabled styles
                onClick={handleAddToCart}
                disabled={isLoading}
              >
                <FaShoppingCart size={"1.5rem"} className="mr-2" />
                {isLoading ? "Adding..." : "Add to Cart"}
              </button>
              <button
                className="p-1 hover:bg-violet-100 rounded flex items-center ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCheckoutNow}
                disabled={isLoading}
              >
                <MdShoppingCartCheckout size={"1.5rem"} className="mr-2" />
                {isLoading ? "Processing..." : "Checkout Now"}
              </button>
            </div>
          </div>
        </div>
        {/* Add to Cart / Checkout Buttons (Mobile - bottom right) */}
        <div className='max-md:flex hidden bottom-5 z-20 right-5 absolute gap-2 bg-white p-3 rounded-lg shadow-lg'> {/* Added styles for mobile buttons */}
           <button
            className="p-1 hover:bg-violet-100 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <FaShoppingCart size={"1.5rem"} className="mr-2" />
            {isLoading ? "Adding..." : "Cart"} {/* Shorter text for mobile? */}
          </button>
          <button
            className="p-1 hover:bg-violet-100 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCheckoutNow}
            disabled={isLoading}
          >
            <MdShoppingCartCheckout size={"1.5rem"} className="mr-2" />
            {isLoading ? "..." : "Buy"} {/* Shorter text for mobile? */}
          </button>
        </div>

        {/* Konva Stage */}
        <div className='flex justify-center items-center w-full h-full pt-20'> {/* Adjust padding top to clear the toolbar */}
          <Stage
            width={phoneCaseClip.width}
            height={phoneCaseClip.height}
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onClick} // Main click handler for selection/deselection
             // Add onTouch handlers for mobile? onTouchStart, onTouchMove, onTouchEnd
          >
            {/* Background Layer */}
            <Layer ref={backgroundLayerRef}>
              {/* Conditional Colored Background */}
              {showColoredBackground && caseBackgroundColor && (
                <Rect
                  id="colored-background" // Give it an ID
                  x={0}
                  y={0}
                  width={phoneCaseClip.width}
                  height={phoneCaseClip.height}
                  fill={caseBackgroundColor} // Use the determined color
                  // Prevent selection of the background rect
                  listening={false} // Set to false so clicks go through to the image or stage
                />
              )}
              {/* Phone Case Frame (SVG Image Overlay) */}
              {caseImage && ( // Render only when image is loaded
                 <KonvaImage
                    id="bg" // Give it an ID
                    image={caseImage}
                    width={phoneCaseClip.width}
                    height={phoneCaseClip.height}
                    // Ensure clicks go through unless explicitly needed for selection (unlikely for background)
                    listening={false} // Set to false so clicks go through to the layer below
                 />
              )}
              {/* Maybe add a placeholder if caseImage is not loaded */}
              {!caseImage && (
                  <Rect // Simple grey background placeholder
                      x={0} y={0} width={phoneCaseClip.width} height={phoneCaseClip.height} fill="#f0f0f0"
                      listening={false}
                   />
              )}
               {/* Optional: Display selected model/material/style info */}
               {/*
                <Text
                    x={10} y={10} text={`Model: ${selectedModel || 'N/A'}`} fontSize={12} fill="black"
                    listening={false} // Don't interfere with editor
                 />
                 <Text
                    x={10} y={30} text={`Material: ${selectedMaterial || 'N/A'}`} fontSize={12} fill="black"
                     listening={false}
                 />
                 <Text
                    x={10} y={50} text={`Style: ${selectedCaseStyle || 'N/A'}`} fontSize={12} fill="black"
                     listening={false}
                 />
               */}
            </Layer>

            {/* Editing Layer (Shapes, Images, Text) */}
            <Layer ref={editLayerRef}>
              {/* Scribbles */}
              {scribbles.map((scribble) => (
                <Line
                  key={scribble.id}
                  id={scribble.id}
                  points={scribble.points}
                  stroke={scribble.fillColor} // Use the color picker color
                  strokeWidth={4}
                  tension={0.5} // Optional: Add tension for smoother lines
                  lineCap="round" // Optional: Round line caps
                  lineJoin="round" // Optional: Round line joins
                  draggable={action === ACTIONS.SELECT} // Only draggable in select mode
                   // Add event listeners for selection
                  onClick={handleShapeClick}
                  onTap={handleShapeClick} // For mobile tap
                   // Handle drag end to update position state if needed (currently position is implicitly in points)
                  // onDragEnd={(e) => { /* Update points based on new position */ }}
                />
              ))}
              {/* Uploaded Images */}
              {images.map((image) => (
                image.image ? (
                  <KonvaImage
                    key={image.id}
                    id={image.id}
                    image={image.image}
                    x={image.x}
                    y={image.y}
                    width={image.width}
                    height={image.height}
                    draggable={action === ACTIONS.SELECT} // Only draggable in select mode
                     // Add event listeners for selection and drag end
                    onClick={handleShapeClick}
                    onTap={handleShapeClick} // For mobile tap
                    onDragEnd={(e) => {
                      // Update the image position in state after dragging
                      setImages(prevImages =>
                        prevImages.map(img =>
                          img.id === image.id ? { ...img, x: e.target.x(), y: e.target.y() } : img
                        )
                      );
                    }}
                    // Add transformend event to update width/height/rotation state
                    onTransformEnd={(e) => {
                        const node = e.target;
                         // Calculate new scale and update state
                         const scaleX = node.scaleX();
                         const scaleY = node.scaleY();
                         const newWidth = Math.max(5, node.width() * scaleX);
                         const newHeight = Math.max(5, node.height() * scaleY);
                         const newRotation = node.rotation(); // Get rotation

                         node.scaleX(1); // Reset scale to 1
                         node.scaleY(1);
                         node.rotation(newRotation); // Apply new rotation if needed

                         setImages(prevImages =>
                             prevImages.map(img =>
                                 img.id === image.id ? { ...img, x: node.x(), y: node.y(), width: newWidth, height: newHeight, rotation: newRotation } : img // Store rotation if needed
                             )
                         );
                    }}
                  />
                ) : null
              ))}
              {/* Text Elements */}
              {textElements.map(text => (
                <Text
                  key={text.id}
                  id={text.id}
                  x={text.x}
                  y={text.y}
                  text={text.text}
                  fontSize={text.fontSize}
                  fontFamily={text.fontFamily}
                  fill={text.fill}
                  draggable={action === ACTIONS.SELECT} // Only draggable in select mode
                  // Add event listeners for selection, drag end, and double click for editing
                  onClick={handleShapeClick}
                  onTap={handleShapeClick} // For mobile tap
                  onDblClick={() => { // Desktop double click
                    if (action === ACTIONS.SELECT) { // Only allow editing in select mode
                       const newText = prompt('Enter new text:', text.text);
                       if (newText !== null) {
                         updateTextElement(text.id, { text: newText });
                       }
                    }
                  }}
                  // Add onDblTap for mobile double tap
                  onDblTap={() => {
                     if (action === ACTIONS.SELECT) {
                        const newText = prompt('Enter new text:', text.text);
                        if (newText !== null) {
                          updateTextElement(text.id, { text: newText });
                        }
                     }
                   }}
                  onDragEnd={(e) => {
                    // Update position state after dragging
                    updateTextElement(text.id, { x: e.target.x(), y: e.target.y() });
                  }}
                   // Add transformend event to update font size/rotation state
                   onTransformEnd={(e) => {
                       const node = e.target;
                        // Text scaling affects font size.
                        // To update font size based on scale: newSize = oldSize * scaleY
                        // Or update width/height directly if using text as a block element
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        const newFontSize = Math.max(5, text.fontSize * scaleY); // Minimum font size
                        const newRotation = node.rotation();

                        node.scaleX(1); // Reset scale
                        node.scaleY(1);
                        node.rotation(newRotation); // Apply new rotation

                       updateTextElement(text.id, {
                           x: node.x(),
                           y: node.y(),
                           fontSize: newFontSize,
                            // Add rotation to state if needed
                            // rotation: newRotation
                        });
                   }}
                />
              ))}
              {/* Transformer for scaling/rotating selected shapes */}
              <Transformer
                ref={transformerRef}
                 // Only show rotation and scaling anchors
                rotateEnabled={true}
                resizeEnabled={true}
                enabledAnchors={[
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right'
                ]}
                 // Restrict resizing, e.g., minimum size
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit size to some minimum value
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  // Keep aspect ratio? (More complex, depends on use case)
                  // Let's allow free resize for now as per default transformer
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

// Use dynamic import with ssr: false because Konva uses DOM elements
export default dynamic(() => Promise.resolve(PhoneCaseEditor), { ssr: false });