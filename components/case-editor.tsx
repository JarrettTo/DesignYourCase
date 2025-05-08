'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ACTIONS } from "../constants";
import useImage from 'use-image';
import Konva from 'konva';
import { Node, NodeConfig } from 'konva/lib/Node';
import { createClient } from '@supabase/supabase-js';
import { CaseType } from '@/lib/database/styles';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for the shapes and actions
type ShapeType = 'RECTANGLE' | 'CIRCLE' | 'ARROW' | 'SCRIBBLE' | 'TEXT';
type Shape = {
    id: string;
    x: number;
    y: number;
    fillColor: string;
    width?: number;
    height?: number;
    radius?: number;
    points?: number[];
    image?: HTMLImageElement;
};

type SelectedShape = {
    id: string;
    type: string;
} | null;

// Add props type for PhoneCaseEditor
interface PhoneCaseEditorProps {
    id: number;
    phoneModel: string;
    phoneBrand: string;
    thumbnail: string;
    color: string;
    material: string;
    seller: string;
    type: string;
    variation: string;
    price: number | null;
    mockup: string | null;
}

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
  phone_model: string;
  case_type: string;
  color: string;
  created_at?: string;
}

const iPhoneModelsImages = [
  "iphone-12/Iphone 12.svg",
  "iphone-12/Iphone 12 pro.svg",
  "iphone-12/Iphone 12 pro max.svg",
  "iphone-13/iPhone 13.svg",
  "iphone-13/iPhone 13 pro.svg",
  "iphone-13/iPhone 13 pro max.svg",
  "iphone-14/iPhone 14.svg",
  "iphone-14/iPhone 14 pro.svg",
  "iphone-14/iPhone 14 pro max.svg",
]

// Add these font options after the imports
const FONT_OPTIONS = [
  { name: 'Arial', value: 'Arial' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Helvetica', value: 'Helvetica' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Verdana', value: 'Verdana' },
  { name: 'Courier New', value: 'Courier New' },
];

function PhoneCaseEditor({
    id,
    phoneModel: initialPhoneModel,
    phoneBrand,
    thumbnail,
    color,
    material,
    seller,
    type,
    variation,
    price,
    mockup
}: PhoneCaseEditorProps) {  
  const { data: session } = useSession();  
  const router = useRouter();
  const [phoneModel, setPhoneModel] = useState(initialPhoneModel);
  const searchParams = useSearchParams();
  const index = parseInt(variation, 10);
  const [isLoading, setIsLoading] = useState(false);
    
  const stageRef = useRef<Konva.Stage>(null);
  const editLayerRef = useRef<Konva.Layer>(null);
  const backgroundLayerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [action, setAction] = useState<ShapeType | string>(ACTIONS.SELECT);
  const [fillColor, setFillColor] = useState<string>("#ff0000");
  const [scribbles, setScribbles] = useState<Shape[]>([]);
  const [images, setImages] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<SelectedShape>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [showTextControls, setShowTextControls] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number | null>(null);

  const addTextElement = () => {
      const textId = `text-${uuidv4()}`;
      const newTextElement: TextElement = {
          id: textId,
          x: 50,
          y: 50,
          text: 'Sample Text',
          fontSize: fontSize,
          fontFamily: selectedFont,
          fill: fillColor,
      };
      setTextElements([...textElements, newTextElement]);
      setShowTextControls(true);
      
      // Select the new text element after it's added
      setTimeout(() => {
        const textNode = stageRef.current?.findOne(`#${textId}`);
        if (textNode && transformerRef.current) {
          selectShape(textNode);
        }
      }, 50);
  };

  const updateTextElement = (id: string, newProps: Partial<TextElement>) => {
      setTextElements(textElements.map(text => text.id === id ? { ...text, ...newProps } : text));
  };

  // Use the phoneModel prop to determine which image to load
  const [caseImage] = useImage(`/assets/frames/${iPhoneModelsImages[index]}`, 'anonymous');    
  const [mockupImage] = useImage(mockup || '', 'anonymous');
  const strokeColor = "#000";
  const isPainting = useRef(false);
  const currentShapeId = useRef<string | undefined>();
  const isDraggable = action === ACTIONS.SELECT;

  const phoneCaseClip = {
      x: 0,
      y: 0,
      width: 300,
      height: 600,
  };

  // Function to handle shape selection
  const selectShape = (node: Konva.Node | null) => {
    // Clear previous selection
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
    
    if (!node || node.id() === 'bg' || node === transformerRef.current) {
      setSelectedShape(null);
      setSelectedImageId(null);
      setShowTextControls(false);
      return;
    }
    
    // Set the selected shape state
    setSelectedShape({
      id: node.id(),
      type: node.getClassName(),
    });
    
    if (node.getClassName() === 'Image') {
      setSelectedImageId(node.id());
      setShowTextControls(false);
    } else if (node.getClassName() === 'Text') {
      setSelectedImageId(null);
      setShowTextControls(true);
      // Update font controls to match selected text
      const textElement = textElements.find(text => text.id === node.id());
      if (textElement) {
        setSelectedFont(textElement.fontFamily);
        setFontSize(textElement.fontSize);
        setFillColor(textElement.fill);
      }
    } else {
      setSelectedImageId(null);
      setShowTextControls(false);
    }
    
    // Attach transformer to the node
    if (transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  };

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
            fillColor,
          },
        ]);
        break;
      default:
        break;
    }
  }

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
                    return {
                      ...scribble,
                      points: scribble.points ? [...scribble.points, x, y] : [x, y],
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

  function onPointerUp() {
    isPainting.current = false;
  }

  async function handleExport() {
    const stage = stageRef.current;
    if (!stage) {
      console.error("Stage not defined");
      return;
    }

    console.log("Starting export process...");
    console.log("Stage dimensions:", {
      width: stage.width(),
      height: stage.height(),
      scale: stage.scaleX()
    });

    // Create a zip file
    const zip = new JSZip();
    console.log("Created zip file");

    try {
      // Hide UI elements before export
      if (transformerRef.current) {
        transformerRef.current.visible(false);
      }
      // Hide text controls
      setShowTextControls(false);
      // Force a redraw
      stage.batchDraw();

      // Export the full stage as a JPG
      console.log("Attempting to export stage as JPG...");
      const fullStageUri = stage.toDataURL({
        mimeType: 'image/jpeg',
        quality: 0.9,
        pixelRatio: 2
      });
      console.log("Stage exported to data URL:", fullStageUri.substring(0, 50) + "...");
      
      const fullStageBase64 = fullStageUri.split(',')[1];
      console.log("Base64 data length:", fullStageBase64.length);
      
      zip.file("case_design.jpg", fullStageBase64, {base64: true});
      console.log("Added case_design.jpg to zip");

      // Export individual images if they exist
      if (images.length > 0) {
        console.log("Found", images.length, "images to export");
        const imagesFolder = zip.folder("images");
        if (imagesFolder) {
          for (let i = 0; i < images.length; i++) {
            const image = stage.findOne(`#${images[i].id}`);
            if (image) {
              console.log(`Exporting image ${i + 1}...`);
              const imageUri = image.toDataURL({
                mimeType: 'image/png',
                quality: 1,
                pixelRatio: 2
              });
              const imageBase64 = imageUri.split(',')[1];
              imagesFolder.file(`image_${i + 1}.png`, imageBase64, {base64: true});
              console.log(`Added image_${i + 1}.png to zip`);
            }
          }
        }
      }

      // Generate the zip file
      console.log("Generating zip file...");
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });
      console.log("Zip file generated, size:", content.size, "bytes");

      // Save the zip file
      console.log("Saving zip file...");
      saveAs(content, "case_design.zip");
      console.log("Export completed successfully");

      // Restore UI elements
      if (transformerRef.current) {
        transformerRef.current.visible(true);
      }
      // Restore text controls if a text element was selected
      if (selectedShape && selectedShape.type === 'Text') {
        setShowTextControls(true);
      }
      // Force a redraw
      stage.batchDraw();
    } catch (error) {
      console.error("Error during export:", error);
      // Make sure to restore UI elements even if there's an error
      if (transformerRef.current) {
        transformerRef.current.visible(true);
      }
      if (selectedShape && selectedShape.type === 'Text') {
        setShowTextControls(true);
      }
      stage.batchDraw();
    }
  }

  function onClick(e: { target: any; evt: any; }) {
    if (action !== ACTIONS.SELECT) return;
    
    // Get the clicked shape
    const shape = e.target;
    
    // If clicking on the stage or background, deselect
    if (shape === stageRef.current || shape.id() === 'bg') {
      selectShape(null);
      return;
    }
    
    // Prevent event bubbling
    e.evt.cancelBubble = true;
    
    // Select the shape
    selectShape(shape);
  }

  function handleShapeClick(e: any) {
    if (action !== ACTIONS.SELECT) return;
    
    // Prevent event bubbling to avoid selecting/deselecting conflicts
    e.cancelBubble = true;
    e.evt.cancelBubble = true;
    e.evt.stopPropagation();
    
    // Select the shape
    selectShape(e.target);
  }

  function bringForward(id: string) {
    const shape = stageRef.current?.findOne(`#${id}`);
    shape?.moveUp();
    editLayerRef.current?.batchDraw();
  }

  function sendBackward(id: string) {
    const shape = stageRef.current?.findOne(`#${id}`);
    shape?.moveDown();
    editLayerRef.current?.batchDraw();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleDelete() {
    if (selectedShape) {
      const { id, type } = selectedShape;

      switch (type) {
        case 'Line':
          setScribbles((prevScribbles) =>
            prevScribbles.filter((scribble) => scribble.id !== id)
          );
          break;
        case 'Image':
          setImages((prevImages) =>
            prevImages.filter((image) => image.id !== id)
          );
          break;
        case 'Text':
          setTextElements((prevTexts) =>
            prevTexts.filter((text) => text.id !== id)
          );
          break;
        default:
          break;
      }

      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      setSelectedShape(null);
      setSelectedImageId(null);
    } 
  }

  // Update selection when action changes
  useEffect(() => {
    if (action !== ACTIONS.SELECT && selectedShape && transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
      setSelectedShape(null);
      setSelectedImageId(null);
    }
  }, [action, selectedShape]);

  useEffect(() => {
    function handleKeyDown(e: { key: string; }) {
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShape, selectedImageId, handleDelete]);

  const handleModelSelect = (model: any) => {
    setPhoneModel(model);
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      if (event.target) {
        img.src = event.target.result as string;
      }
  
      img.onload = () => {
        const id = uuidv4();
        const maxWidth = phoneCaseClip.width * 0.8;
        const maxHeight = phoneCaseClip.height * 0.8;
        
        const scaledDimensions = scaleImage(img, maxWidth, maxHeight);
        
        setImages((prevImages) => [
          ...prevImages,
          {
            id,
            x: (phoneCaseClip.width - scaledDimensions.width) / 2,
            y: (phoneCaseClip.height - scaledDimensions.height) / 2,
            width: scaledDimensions.width,
            height: scaledDimensions.height,
            image: img,
            fillColor: fillColor,
          },
        ]);
        
        setTimeout(() => {
          const imageNode = stageRef.current?.findOne(`#${id}`);
          if (imageNode && transformerRef.current) {
            selectShape(imageNode);
          }
        }, 50);
      };
  
      img.onerror = () => {
        console.error("Error loading the image");
      };
    };
    
    reader.readAsDataURL(file);
  };

  function scaleImage(img: HTMLImageElement, maxWidth: number, maxHeight: number) {
    const ratioX = maxWidth / img.width;
    const ratioY = maxHeight / img.height;
    const ratio = Math.min(ratioX, ratioY);

    return {
      width: img.width * ratio,
      height: img.height * ratio
    };
  }

  // Helper function to get design JSON and image data
  async function getDesignData() {
    const stage = stageRef.current;
    if (!stage) {
      console.error("Stage not defined");
      return null;
    }

    // Get design image as DataURL
    const designImageDataURL = stage.toDataURL();
    
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

  async function handleAddToCart() {
    setIsLoading(true);
    try {
      const designData = await getDesignData();
      if (!designData) {
        throw new Error("Failed to get design data");
      }
  
      // Get the current user's email
      const userEmail = session?.user?.email;
      if (!userEmail) {
        throw new Error("User must be logged in to save designs");
      }

      // Create the design record
      const { data: designRecord, error: designError } = await supabase
        .from('designs')
        .insert({
          user_id: userEmail,
          case_style_id: id,
          design_data: designData.designJSON
        })
        .select()
        .single();

      if (designError || !designRecord) {
        throw new Error("Failed to create design record: " + designError?.message);
      }

      const designId = designRecord.id;
      console.log("Created design record with ID:", designId);

      // Upload the stage image
      const stageImageFile = await fetch(designData.designImage).then((res) => res.blob());
      const stageImagePath = `design-images/${userEmail}/${designId}/stage.png`;
      
      const { error: stageUploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(stageImagePath, stageImageFile);

      if (stageUploadError) {
        throw new Error("Failed to upload stage image: " + stageUploadError.message);
      }

      // Upload individual images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.image) {
          const response = await fetch(image.image.src);
          const blob = await response.blob();
          
          const imagePath = `design-images/${userEmail}/${designId}/image_${i + 1}.png`;
          
          const { error: imageUploadError } = await supabase.storage
            .from('phone-case-designs')
            .upload(imagePath, blob);

          if (imageUploadError) {
            console.error(`Failed to upload image ${i + 1}:`, imageUploadError);
            continue;
          }
        }
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add design to cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckout() {
    setIsLoading(true);
    try {
      const designData = await getDesignData();
      if (!designData) {
        throw new Error("Failed to get design data");
      }
  
      // Get the current user's email
      const userEmail = session?.user?.email;
      if (!userEmail) {
        throw new Error("User must be logged in to save designs");
      }

      // Create the design record
      const { data: designRecord, error: designError } = await supabase
        .from('designs')
        .insert({
          user_id: userEmail,
          case_style_id: id,
          design_data: designData.designJSON
        })
        .select()
        .single();

      if (designError || !designRecord) {
        throw new Error("Failed to create design record: " + designError?.message);
      }

      const designId = designRecord.id;
      console.log("Created design record with ID:", designId);

      // Upload the stage image
      const stageImageFile = await fetch(designData.designImage).then((res) => res.blob());
      const stageImagePath = `design-images/${userEmail}/${designId}/stage.png`;
      
      const { error: stageUploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(stageImagePath, stageImageFile);

      if (stageUploadError) {
        throw new Error("Failed to upload stage image: " + stageUploadError.message);
      }

      // Upload individual images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.image) {
          const response = await fetch(image.image.src);
          const blob = await response.blob();
          
          const imagePath = `design-images/${userEmail}/${designId}/image_${i + 1}.png`;
          
          const { error: imageUploadError } = await supabase.storage
            .from('phone-case-designs')
            .upload(imagePath, blob);

          if (imageUploadError) {
            console.error(`Failed to upload image ${i + 1}:`, imageUploadError);
            continue;
          }
        }
      }

      // Redirect to checkout with the design ID
      router.push(`/checkout?designs=${designId}`);
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Failed to process checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Add this function to handle font changes
  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    if (selectedShape && selectedShape.type === 'Text') {
        updateTextElement(selectedShape.id, { fontFamily: font });
    }
  };

  // Add this function to handle font size changes
  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    if (selectedShape && selectedShape.type === 'Text') {
        updateTextElement(selectedShape.id, { fontSize: size });
    }
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    // Calculate new scale
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    
    // Limit scale between 0.5 and 3
    const limitedScale = Math.max(0.5, Math.min(3, newScale));

    setScale(limitedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    });
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      // Calculate center point between two touches
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      lastCenter.current = center;

      // Calculate distance between touches
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      lastDist.current = dist;
    } else if (touch1) {
      // Single touch - start dragging
      setIsDragging(true);
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setPosition({
        x: pointer.x - position.x,
        y: pointer.y - position.y,
      });
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2 && lastCenter.current && lastDist.current) {
      // Calculate new center point
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      // Calculate new distance
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // Calculate scale change
      const scaleChange = dist / lastDist.current;
      const newScale = Math.max(0.5, Math.min(3, scale * scaleChange));

      // Calculate position change
      const dx = center.x - lastCenter.current.x;
      const dy = center.y - lastCenter.current.y;

      setScale(newScale);
      setPosition({
        x: position.x + dx,
        y: position.y + dy,
      });

      lastCenter.current = center;
      lastDist.current = dist;
    } else if (touch1 && isDragging) {
      // Single touch - continue dragging
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setPosition({
        x: pointer.x - position.x,
        y: pointer.y - position.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastCenter.current = null;
    lastDist.current = null;
  };
  
  return (
    <div>
      <div className="relative w-full h-screen overflow-hidden">
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-3">
          <button
            className="px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(to right, #F4D7EA, #D9FBFE)'
            }}
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <FaShoppingCart size={"1.2rem"} />
          </button>
          <button
            className="px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(to right, #F4D7EA, #D9FBFE)'
            }}
            onClick={handleCheckout}
            disabled={isLoading}
          >
            <MdShoppingCartCheckout size={"1.2rem"} className="mr-2" />
            {isLoading ? "Processing..." : "Checkout"}
          </button>
        </div>

        <div className='flex justify-center items-center w-full h-full'>
          <Stage
            width={phoneCaseClip.width}
            height={phoneCaseClip.height}
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onClick}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            draggable={action === ACTIONS.SELECT}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
          >
            {/* Background Layer */}
            <Layer ref={backgroundLayerRef}>
              {mockupImage && (
                <KonvaImage
                  id="mockup"
                  image={mockupImage}
                  width={phoneCaseClip.width}
                  height={phoneCaseClip.height}
                  listening={false}
                />
              )}
              {type === 'Colored' && (
                <Rect
                  id="colored-background"
                  x={0}
                  y={0}
                  width={phoneCaseClip.width}
                  height={phoneCaseClip.height}
                  fill={color}
                />
              )}
              <KonvaImage
                id="bg"
                image={caseImage}
                width={phoneCaseClip.width}
                height={phoneCaseClip.height}
                listening={action === ACTIONS.SELECT}
              />
            </Layer>
            
            {/* Editing Layer */}
            <Layer ref={editLayerRef}>
              {scribbles.map((scribble) => (
                <Line
                  key={scribble.id}
                  id={scribble.id}
                  points={scribble.points}
                  stroke={scribble.fillColor}
                  strokeWidth={4}
                  draggable={isDraggable}
                  onClick={handleShapeClick}
                />
              ))}
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
                    draggable={isDraggable}
                    onClick={handleShapeClick}
                  />
                ) : null
              ))}
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
                  draggable={isDraggable}
                  onDragEnd={(e) => {
                    updateTextElement(text.id, { x: e.target.x(), y: e.target.y() });
                  }}
                  onClick={handleShapeClick}
                  onDblClick={() => {
                    const newText = prompt('Enter new text:', text.text);
                    if (newText !== null) {
                      updateTextElement(text.id, { text: newText });
                    }
                  }}
                />
              ))}
              <Transformer
                ref={transformerRef}
                rotateEnabled={true}
                resizeEnabled={true}
                enabledAnchors={[
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right'
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit size to some minimum value
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>

        {/* Bottom Toolbar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-4">
          <div className="flex flex-col gap-2">
            {/* Text Controls */}
            {showTextControls && (
              <div className="flex justify-center items-center gap-3 py-2 px-3 w-[90%] sm:w-fit mx-auto border shadow-lg rounded-lg bg-white">
                <select
                  value={selectedFont}
                  onChange={(e) => handleFontChange(e.target.value)}
                  className="px-2 py-1 border rounded"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  min="8"
                  max="72"
                  className="w-16 px-2 py-1 border rounded"
                />
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => {
                    setFillColor(e.target.value);
                    if (selectedShape && selectedShape.type === 'Text') {
                      updateTextElement(selectedShape.id, { fill: e.target.value });
                    }
                  }}
                  className="w-8 h-8"
                />
              </div>
            )}
            
            {/* Main Toolbar */}
            <div className="flex justify-center items-center gap-3 py-2 px-3 w-[90%] sm:w-fit mx-auto border shadow-lg rounded-lg"
              style={{
                background: 'linear-gradient(to right, #F4D7EA, #D9FBFE)'
              }}
            >
              <button 
                className="p-1 hover:bg-white/20 rounded"
                onClick={addTextElement}
              >
                <MdOutlineTextFields size={"2rem"}/>
              </button>
              <button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload" className='hover:bg-white/20 cursor-pointer'>
                  <FaImage size={"2rem"} />
                </label>
              </button>
              <button
                className="p-1 hover:bg-white/20 rounded"
                onClick={handleDelete}
              >
                <IoMdTrash size={"2rem"} />
              </button>
              <button
                className="p-1 hover:bg-white/20 rounded"
                onClick={() => handleExport().catch(console.error)}
              >
                <IoMdDownload size={"2rem"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(PhoneCaseEditor), { ssr: false });