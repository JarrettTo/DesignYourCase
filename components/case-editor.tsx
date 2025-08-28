'use client';

import dynamic from 'next/dynamic';
import { useSessionContext } from '@supabase/auth-helpers-react';
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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CaseType } from '@/lib/database/styles';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClientComponentClient();

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
  const { session } = useSessionContext();  
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
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [lastTapTime, setLastTapTime] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  // Track window dimensions for responsive scaling
  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateWindowDimensions();
    window.addEventListener('resize', updateWindowDimensions);
    return () => window.removeEventListener('resize', updateWindowDimensions);
  }, []);

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
  const isBackgroundDraggable = false;

  // Calculate responsive scaling for all materials
  const getResponsiveScale = () => {
    if (!windowDimensions.width) return 1.5;
    
    const baseWidth = 300;
    const baseHeight = 600;
    
    // Adjust available space based on screen size
    let availableWidthPercent = 0.8; // Default 80%
    let availableHeightPercent = 0.6; // Default 60%
    
    // For very small screens (< 480px), use more aggressive scaling
    if (windowDimensions.width < 480) {
      availableWidthPercent = 0.9; // Use 90% of width
      availableHeightPercent = 0.7; // Use 70% of height
    }
    // For small screens (< 640px), use moderate scaling
    else if (windowDimensions.width < 640) {
      availableWidthPercent = 0.85; // Use 85% of width
      availableHeightPercent = 0.65; // Use 65% of height
    }
    
    const availableWidth = windowDimensions.width * availableWidthPercent;
    const availableHeight = windowDimensions.height * availableHeightPercent;
    
    const scaleX = availableWidth / baseWidth;
    const scaleY = availableHeight / baseHeight;
    
    // Use the smaller scale to ensure it fits both dimensions
    let maxScale = 1.8; // Default max scale
    let minScale = 1.2; // Default min scale
    
    // For very small screens, allow much smaller scaling
    if (windowDimensions.width < 480) {
      maxScale = 1.6;
      minScale = 1; // Allow much smaller scale
    }
    // For small screens, allow smaller scaling
    else if (windowDimensions.width < 640) {
      maxScale = 1.6;
      minScale = 0.8;
    }
    
    const responsiveScale = Math.min(scaleX, scaleY, maxScale);
    return Math.max(responsiveScale, minScale);
  };

  const responsiveScale = getResponsiveScale();

  const phoneCaseClip = {
      x: material === "wrapped" ? -(300 * (responsiveScale - 1) / 2) : 0,
      y: material === "wrapped" ? -(600 * (responsiveScale - 1) / 2) : 0,
      width: material === "wrapped" ? 300 * responsiveScale : 300,
      height: material === "wrapped" ? 600 * responsiveScale : 600,
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

      // Export the full stage as a PNG
      console.log("Attempting to export stage as PNG...");
      const fullStageUri = stage.toDataURL({
        mimeType: 'image/png',
        quality: 1.0,
        pixelRatio: 4
      });
      console.log("Stage exported to data URL:", fullStageUri.substring(0, 50) + "...");
      
      const fullStageBase64 = fullStageUri.split(',')[1];
      console.log("Base64 data length:", fullStageBase64.length);
      
      zip.file("case_design.png", fullStageBase64, {base64: true});
      console.log("Added case_design.png to zip");

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
                pixelRatio: 4
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

  // Show wrapped modal on first load
  useEffect(() => {
    if (material === "wrapped") {
      setShowWrappedModal(true);
    }
  }, [material]);

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

    // Hide background layer to get design only
    const backgroundLayer = backgroundLayerRef.current;
    const wasBackgroundVisible = backgroundLayer?.visible();
    if (backgroundLayer) {
      backgroundLayer.visible(false);
    }
    
    // Force a redraw
    stage.batchDraw();

    // Get design image without case layer as DataURL
    const designImageDataURL = stage.toDataURL({
      mimeType: 'image/png',
      quality: 1.0,
      pixelRatio: 4
    });
    
    // Restore background layer visibility
    if (backgroundLayer && wasBackgroundVisible !== undefined) {
      backgroundLayer.visible(wasBackgroundVisible);
    }
    
    // Force another redraw
    stage.batchDraw();

    // Get stage image with case layer as DataURL
    const stageImageDataURL = stage.toDataURL({
      mimeType: 'image/png',
      quality: 1.0,
      pixelRatio: 4
    });
    
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
      designImage: designImageDataURL,
      stageImage: stageImageDataURL
    };
  }

  async function handleAddToCart() {
    setIsLoading(true);
    try {
      // Deselect any selected shape and hide transformer before export
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.visible(false);
      }
      setSelectedShape(null);
      setSelectedImageId(null);
      setShowTextControls(false);
      stageRef.current?.batchDraw();

      const designData = await getDesignData();
      if (!designData) {
        throw new Error("Failed to get design data");
      }
  
      // Get the current user's id
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("User must be logged in to save designs");
      }

      // Create the design record
      const { data: designRecord, error: designError } = await supabase
        .from('designs')
        .insert({
          user_id: userId,
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

      // Restore transformer after export
      if (transformerRef.current) {
        transformerRef.current.visible(true);
      }
      if (selectedShape && selectedShape.type === 'Text') {
        setShowTextControls(true);
      }
      stageRef.current?.batchDraw();

      // Upload the design image (without case layer)
      const designImageFile = await fetch(designData.designImage).then((res) => res.blob());
      const designImagePath = `design-images/${userId}/${designId}/design.png`;
      const { error: designUploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(designImagePath, designImageFile);
      if (designUploadError) {
        throw new Error("Failed to upload design image: " + designUploadError.message);
      }

      // Upload the stage image (with case layer)
      const stageImageFile = await fetch(designData.stageImage).then((res) => res.blob());
      const stageImagePath = `design-images/${userId}/${designId}/stage.png`;
      const { error: stageUploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(stageImagePath, stageImageFile);
      if (stageUploadError) {
        throw new Error("Failed to upload stage image: " + stageUploadError.message);
      }

      // Get public URL for uploaded design image (use this as the main image_url)
      const { data: publicUrlData } = supabase.storage
        .from('phone-case-designs')
        .getPublicUrl(designImagePath);
      const designImageUrl = publicUrlData?.publicUrl;
      // Update the design record with image_url
      await supabase
        .from('designs')
        .update({ image_url: designImageUrl })
        .eq('id', designId);

      // Upload individual images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.image) {
          const response = await fetch(image.image.src);
          const blob = await response.blob();
          const imagePath = `design-images/${userId}/${designId}/image_${i + 1}.png`;
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
      router.push('/cart');
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
      // Deselect any selected shape and hide transformer before export
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.visible(false);
      }
      setSelectedShape(null);
      setSelectedImageId(null);
      setShowTextControls(false);
      stageRef.current?.batchDraw();

      const designData = await getDesignData();
      if (!designData) {
        throw new Error("Failed to get design data");
      }
  
      // Get the current user's id
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("User must be logged in to save designs");
      }

      // Create the design record
      const { data: designRecord, error: designError } = await supabase
        .from('designs')
        .insert({
          user_id: userId,
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

      // Restore transformer after export
      if (transformerRef.current) {
        transformerRef.current.visible(true);
      }
      if (selectedShape && selectedShape.type === 'Text') {
        setShowTextControls(true);
      }
      stageRef.current?.batchDraw();

      // Upload the design image (without case layer)
      const designImageFile = await fetch(designData.designImage).then((res) => res.blob());
      const designImagePath = `design-images/${userId}/${designId}/design.png`;
      const { error: designUploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(designImagePath, designImageFile);
      if (designUploadError) {
        throw new Error("Failed to upload design image: " + designUploadError.message);
      }

      // Upload the stage image (with case layer)
      const stageImageFile = await fetch(designData.stageImage).then((res) => res.blob());
      const stageImagePath = `design-images/${userId}/${designId}/stage.png`;
      const { error: stageUploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(stageImagePath, stageImageFile);
      if (stageUploadError) {
        throw new Error("Failed to upload stage image: " + stageUploadError.message);
      }

      // Get public URL for uploaded design image (use this as the main image_url)
      const { data: publicUrlData } = supabase.storage
        .from('phone-case-designs')
        .getPublicUrl(designImagePath);
      const designImageUrl = publicUrlData?.publicUrl;
      // Update the design record with image_url
      await supabase
        .from('designs')
        .update({ image_url: designImageUrl })
        .eq('id', designId);

      // Upload individual images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.image) {
          const response = await fetch(image.image.src);
          const blob = await response.blob();
          const imagePath = `design-images/${userId}/${designId}/image_${i + 1}.png`;
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

  // Function to start inline text editing
  const startTextEditing = (textId: string, currentText: string) => {
    setEditingTextId(textId);
    setEditingTextValue(currentText);
    setCursorPosition(currentText.length);
    setSelectionStart(0);
    setSelectionEnd(currentText.length);
    
    // Focus the hidden input after a short delay
    setTimeout(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
        hiddenInputRef.current.select();
      }
    }, 10);
  };

  // Function to finish inline text editing
  const finishTextEditing = () => {
    setEditingTextId(null);
    setEditingTextValue('');
  };

  // Function to handle text input changes
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditingTextValue(newValue);
    
    // Update cursor and selection position
    setCursorPosition(e.target.selectionStart || 0);
    setSelectionStart(e.target.selectionStart || 0);
    setSelectionEnd(e.target.selectionEnd || 0);
    
    // Update the text element in real-time
    if (editingTextId) {
      updateTextElement(editingTextId, { text: newValue });
    }
  };

  // Function to handle text input key press
  const handleTextInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finishTextEditing();
    } else if (e.key === 'Escape') {
      setEditingTextId(null);
      setEditingTextValue('');
    }
  };

  // Function to handle cursor and selection updates
  const handleTextInputSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorPosition(target.selectionStart || 0);
    setSelectionStart(target.selectionStart || 0);
    setSelectionEnd(target.selectionEnd || 0);
  };

  // Function to handle mobile double tap
  const handleTextTap = (textId: string, currentText: string) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      startTextEditing(textId, currentText);
    } else if (tapLength > 500) {
      // Single tap - just select the text
      handleShapeClick({ target: { id: () => textId } });
    }
    setLastTapTime(currentTime);
  };


  
  return (
    <>
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      <div className='px-6 pb-20'>
        <div className="relative w-full h-screen overflow-hidden pt-20 sm:pt-4 pb-20">
        {/* Action Buttons */}
        <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-10 flex justify-between items-center">
          {/* Case Information */}
          <div className="flex flex-col gap-1 text-sm font-medium">
            <span className="capitalize">{phoneBrand}</span>
            <span className="capitalize">{phoneModel} {material}</span>
            {color && color.trim() !== "" && (
              <div className="flex items-center gap-2">
                <span className="capitalize">{color}</span>
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="px-4 py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:opacity-90 order-2 sm:order-1"
              style={{
                background: 'linear-gradient(to right, #F4D7EA, #D9FBFE)'
              }}
              onClick={handleAddToCart}
              disabled={isLoading}
            >
              Add to Cart
            </button>
            <button
              className="px-4 py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:opacity-90 order-1 sm:order-2"
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
        </div>

        <div className='grid mt-4 sm:mt-10 place-items-center w-full h-full pb-12 sm:pb-20'>
          <Stage
            width={phoneCaseClip.width}
            height={phoneCaseClip.height}
            scaleX={windowDimensions.width < 480 ? 0.75 : windowDimensions.width < 640 ? 0.8 : 0.9}
            scaleY={windowDimensions.width < 480 ? 0.75 : windowDimensions.width < 640 ? 0.8 : 0.9}
            x={phoneCaseClip.width * (windowDimensions.width < 480 ? 0.1 : windowDimensions.width < 640 ? 0.1 : 0.05)}
            y={phoneCaseClip.height * (windowDimensions.width < 480 ? 0.1 : windowDimensions.width < 640 ? 0.1 : 0.05)}
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onClick}
            draggable={false}
          >
            {/* Background Layer */}
            <Layer ref={backgroundLayerRef}>
              {mockupImage && (
                <KonvaImage
                  id="mockup"
                  image={mockupImage}
                  width={material === "wrapped" ? (phoneCaseClip.width * 0.8) : phoneCaseClip.width}
                  height={material === "wrapped" ? (phoneCaseClip.height * 0.8) : phoneCaseClip.height}
                  x={material === "wrapped" ? (phoneCaseClip.width - phoneCaseClip.width * 0.8) / 2 : 0}
                  y={material === "wrapped" ? (phoneCaseClip.height - phoneCaseClip.height * 0.8) / 2 : 0}
                  listening={false}
                  draggable={false}
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
                  listening={false}
                  draggable={false}
                />
              )}
              <KonvaImage
                id="bg"
                image={caseImage}
                width={300}
                height={600}
                x={material === "wrapped" ? (phoneCaseClip.width - 300) / 2 : 0}
                y={material === "wrapped" ? (phoneCaseClip.height - 600) / 2 : 0}
                listening={false}
                draggable={false}
              />
                            {material === "wrapped" && (
                <Rect
                  id="wrapped-outline"
                  x={(phoneCaseClip.width - phoneCaseClip.width * 0.95) / 2}
                  y={(phoneCaseClip.height - phoneCaseClip.height * 0.95) / 2}
                  width={phoneCaseClip.width * 0.95}
                  height={phoneCaseClip.height * 0.95}
                  stroke="black"
                  strokeWidth={4}
                  fill="transparent"
                  listening={false}
                  draggable={false}
                />
              )}
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
                  onClick={(e) => {
                    // Handle both click and tap
                    handleShapeClick(e);
                    handleTextTap(text.id, text.text);
                  }}
                  onDblClick={() => {
                    startTextEditing(text.id, text.text);
                  }}
                  onTouchStart={(e) => {
                    // Handle touch events for mobile
                    e.evt.preventDefault();
                    // On mobile, start editing immediately on touch
                    startTextEditing(text.id, text.text);
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
        </div>



        {/* Hidden Text Input for Real-time Editing */}
        {editingTextId && (
          <input
            ref={hiddenInputRef}
            type="text"
            value={editingTextValue}
            onChange={handleTextInputChange}
            onKeyDown={handleTextInputKeyPress}
            onSelect={handleTextInputSelect}
            onBlur={finishTextEditing}
            autoFocus
            className="fixed top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
          />
        )}

        {/* Visual Cursor and Selection Indicators */}
        {editingTextId && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {textElements.map(text => {
              if (text.id === editingTextId) {
                const stage = stageRef.current;
                if (stage) {
                  const stageRect = stage.container().getBoundingClientRect();
                  const scale = stage.scaleX();
                  
                  // Calculate text metrics
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.font = `${text.fontSize * scale}px ${text.fontFamily}`;
                    
                    // Calculate cursor position
                    const textBeforeCursor = editingTextValue.substring(0, cursorPosition);
                    const cursorX = ctx.measureText(textBeforeCursor).width;
                    
                    // Calculate selection positions
                    const textBeforeSelection = editingTextValue.substring(0, selectionStart);
                    const textBeforeSelectionEnd = editingTextValue.substring(0, selectionEnd);
                    const selectionStartX = ctx.measureText(textBeforeSelection).width;
                    const selectionEndX = ctx.measureText(textBeforeSelectionEnd).width;
                    
                    const textY = text.y * scale;
                    const textX = text.x * scale;
                    const fontSize = text.fontSize * scale;
                    
                    return (
                      <div key={text.id}>
                        {/* Selection Highlight */}
                        {selectionStart !== selectionEnd && (
                          <div
                            className="absolute bg-blue-300 opacity-50 border border-blue-500"
                            style={{
                              left: stageRect.left + textX + selectionStartX,
                              top: stageRect.top + textY,
                              width: selectionEndX - selectionStartX,
                              height: fontSize * 1.2,
                              minWidth: '2px',
                            }}
                          />
                        )}
                        
                        {/* Cursor */}
                        <div
                          className="absolute bg-red-500 animate-pulse"
                          style={{
                            left: stageRect.left + textX + cursorX,
                            top: stageRect.top + textY,
                            height: fontSize * 1.2,
                            width: '1px',
                            animation: 'blink 0.8s infinite',
                          }}
                        />
                      </div>
                    );
                  }
                }
              }
              return null;
            })}
          </div>
        )}

        {/* Bottom Toolbar */}
        <div className="fixed bottom-4 left-0 right-0 z-10 px-4">
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

            </div>
          </div>
        </div>
      
      {/* Wrapped Case Modal */}
      {showWrappedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Design Guidelines</h3>
            <p className="text-gray-700 mb-6">
              For wrapped cases, please ensure to fill the case with design until the black outline.
            </p>
            <button
              className="px-4 py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:opacity-90 w-full"
              style={{
                background: 'linear-gradient(to right, #F4D7EA, #D9FBFE)'
              }}
              onClick={() => setShowWrappedModal(false)}
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(PhoneCaseEditor), { ssr: false });