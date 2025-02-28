'use client';

import dynamic from 'next/dynamic';
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
type PhoneCaseEditorProps = {
    phoneModel: string;
    caseType: string;
    caseSecondType: string;
    type: 'Transparent' | 'Colored';
    color: string;
    modelIndex: string;
};

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

function PhoneCaseEditor({ phoneModel: initialPhoneModel, caseType, caseSecondType, type, color, modelIndex }: PhoneCaseEditorProps) {    
  const router = useRouter();
  const [phoneModel, setPhoneModel] = useState(initialPhoneModel);
  const searchParams = useSearchParams();
  const index = parseInt(modelIndex, 10);
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

  const addTextElement = () => {
      const textId = `text-${uuidv4()}`;
      const newTextElement: TextElement = {
          id: textId,
          x: 50,
          y: 50,
          text: 'Sample Text',
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#000000',
      };
      setTextElements([...textElements, newTextElement]);
      
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
  const [caseImage] = useImage(`/assets/frames/${iPhoneModelsImages[index]}`);    
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
      return;
    }
    
    // Set the selected shape state
    setSelectedShape({
      id: node.id(),
      type: node.getClassName(),
    });
    
    if (node.getClassName() === 'Image') {
      setSelectedImageId(node.id());
    } else {
      setSelectedImageId(null);
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
    if (!stage) return console.log("Stage not defined");

    // Create a zip file
    const zip = new JSZip();

    // Export the full stage as an image
    const fullStageUri = stage.toDataURL();
    const fullStageBase64 = fullStageUri.split(',')[1];
    zip.file("full_design.png", fullStageBase64, {base64: true});

    // Function to export a single node as PNG
    const exportNodeAsPNG = (node: Node<NodeConfig>) => {
      return new Promise((resolve) => {
        const tempStage = new Konva.Stage({
          width: node.width(),
          height: node.height(),
          container: document.createElement('div')
        });
        const layer = new Konva.Layer();
        const clone = node.clone();
        layer.add(clone);
        tempStage.add(layer);
        
        // Ensure the node is centered in the temporary stage
        clone.position({
          x: tempStage.width() / 2,
          y: tempStage.height() / 2
        });
        clone.offset({
          x: clone.width() / 2,
          y: clone.height() / 2
        });
        
        layer.batchDraw();
        
        setTimeout(() => {
          const dataURL = tempStage.toDataURL();
          resolve(dataURL.split(',')[1]);
          tempStage.destroy();
        }, 50);
      });
    };

    // Helper function to export shapes
    const exportShapes = async (shapes: string | any[], shapeType: string) => {
      for (let i = 0; i < shapes.length; i++) {
        const shape = stage.findOne(`#${shapes[i].id}`);
        if (shape) {
          const pngData = await exportNodeAsPNG(shape);
          zip.file(`${shapeType}_${i}.png`, pngData as string, {base64: true});
        }
      }
    };
    await exportShapes(scribbles, 'scribble');
    await exportShapes(images, 'image');

    // Generate the zip file
    const content = await zip.generateAsync({type: "blob"});

    // Save the zip file
    saveAs(content, "design_export.zip");
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
      if (event.target) {
        img.src = event.target.result as string;
      }
  
      img.onload = () => {
        const id = uuidv4();
        const maxWidth = phoneCaseClip.width * 0.8; // 80% of canvas width
        const maxHeight = phoneCaseClip.height * 0.8; // 80% of canvas height
        
        const scaledDimensions = scaleImage(img, maxWidth, maxHeight);
        
        setImages((prevImages) => [
          ...prevImages,
          {
            id,
            x: (phoneCaseClip.width - scaledDimensions.width) / 2, // Center horizontally
            y: (phoneCaseClip.height - scaledDimensions.height) / 2, // Center vertically
            width: scaledDimensions.width,
            height: scaledDimensions.height,
            image: img,
            fillColor: fillColor,
          },
        ]);
        
        // Select the new image after it's added
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

      // Get the current user (or guest ID if not logged in)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'guest-' + uuidv4();

      // 1. Upload the image to Supabase Storage
      const imageFile = await fetch(designData.designImage).then((res) => res.blob());
      const imageFileName = `design-images/${userId}/${uuidv4()}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(imageFileName, imageFile);

      if (uploadError) {
        throw new Error("Failed to upload design image: " + uploadError.message);
      }

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('phone-case-designs')
        .getPublicUrl(imageFileName);

      // 2. Save the design data to the database
      const savedDesign: SavedDesign = {
        user_id: userId,
        design_data: designData.designJSON,
        image_url: publicUrl,
        phone_model: phoneModel,
        case_type: `${caseType} ${caseSecondType}`,
        color: color
      };

      const { data, error } = await supabase
        .from('designs')
        .insert(savedDesign)
        .select();

      if (error) {
        throw new Error("Failed to save design: " + error.message);
      }

      // 3. Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add design to cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckoutNow() {
    setIsLoading(true);
    try {
      const designData = await getDesignData();
      if (!designData) {
        throw new Error("Failed to get design data");
      }

      // Get the current user (or guest ID if not logged in)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'guest-' + uuidv4();

      // 1. Upload the image to Supabase Storage
      const imageFile = await fetch(designData.designImage).then((res) => res.blob());
      const imageFileName = `design-images/${userId}/${uuidv4()}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('phone-case-designs')
        .upload(imageFileName, imageFile);

      if (uploadError) {
        throw new Error("Failed to upload design image: " + uploadError.message);
      }

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('phone-case-designs')
        .getPublicUrl(imageFileName);

      // 2. Save the design data to the database
      const savedDesign: SavedDesign = {
        user_id: userId,
        design_data: designData.designJSON,
        image_url: publicUrl,
        phone_model: phoneModel,
        case_type: `${caseType} ${caseSecondType}`,
        color: color
      };

      const { data, error } = await supabase
        .from('designs')
        .insert(savedDesign)
        .select();

      if (error) {
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
      alert("Failed to proceed to checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div>
      <div className="relative w-full h-screen overflow-hidden">
        <div className="absolute top-0 z-10 w-full py-2">
          <div className="flex justify-center items-center gap-3 py-2 px-3 w-fit mx-auto border shadow-lg rounded-lg">
            <button
              className={
                action === ACTIONS.SELECT
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => setAction(ACTIONS.SELECT)}
            >
              <GiArrowCursor size={"2rem"} />
            </button>
            <button
              className={
                action === ACTIONS.SCRIBBLE
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => setAction(ACTIONS.SCRIBBLE)}
            >
              <LuPencil size={"2rem"} />
            </button>
            <button 
              className="p-1 hover:bg-violet-100 rounded"
              onClick={addTextElement}
            >
              <MdOutlineTextFields size={"2rem"}/>
            </button>
            <button>
              <input
                className="w-6 h-6"
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
              />
            </button>
            
            <button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload" className='hover:bg-violet-100 cursor-pointer'>
                <FaImage size={"2rem"} />
              </label>
            </button>
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={handleDelete}
            >
              <IoMdTrash size={"2rem"} />
            </button>
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={() => handleExport().catch(console.error)}
            >
              <IoMdDownload size={"2rem"} />
            </button>
            <div className='max-md:hidden flex'>
              <button
                className="p-1 hover:bg-violet-100 rounded flex items-center"
                onClick={handleAddToCart}
                disabled={isLoading}
              >
                <FaShoppingCart size={"1.5rem"} className="mr-2" />
                {isLoading ? "Adding..." : "Add to Cart"}
              </button>
              <button
                className="p-1 hover:bg-violet-100 rounded flex items-center ml-2"
                onClick={handleCheckoutNow}
                disabled={isLoading}
              >
                <MdShoppingCartCheckout size={"1.5rem"} className="mr-2" />
                {isLoading ? "Processing..." : "Checkout Now"}
              </button>
            </div>
          </div>
        </div>
        <div className='max-md:flex hidden bottom-5 z-20 right-5 absolute gap-2'>
          <button
            className="p-1 hover:bg-violet-100 rounded flex items-center"
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <FaShoppingCart size={"1.5rem"} className="mr-2" />
            {isLoading ? "Adding..." : "Add to Cart"}
          </button>
          <button
            className="p-1 hover:bg-violet-100 rounded flex items-center"
            onClick={handleCheckoutNow}
            disabled={isLoading}
          >
            <MdShoppingCartCheckout size={"1.5rem"} className="mr-2" />
            {isLoading ? "Processing..." : "Checkout Now"}
          </button>
        </div>
        <div className='flex justify-center items-center w-full h-full pt-20'>
          <Stage
            width={phoneCaseClip.width}
            height={phoneCaseClip.height}
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onClick}
          >
            {/* Background Layer */}
            <Layer ref={backgroundLayerRef}>
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
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(PhoneCaseEditor), { ssr: false });