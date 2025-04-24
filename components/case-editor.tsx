"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { IoMdDownload } from "react-icons/io";
import { FaImage } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import { GiArrowCursor } from "react-icons/gi";
import { IoMdTrash } from "react-icons/io";
import { MdOutlineTextFields } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { MdShoppingCartCheckout } from "react-icons/md";
import { MdLayers } from "react-icons/md";
import { LuRedo2, LuUndo2 } from "react-icons/lu";
import { MdOutlineRemoveCircleOutline } from "react-icons/md";
import { useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
  Text,
  Image as KonvaImage,
} from "react-konva";
import { ACTIONS } from "../constants";
import useImage from "use-image";
import Konva from "konva";
import { Node, NodeConfig } from "konva/lib/Node";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for the shapes and actions
type ShapeType = "RECTANGLE" | "CIRCLE" | "ARROW" | "TEXT";
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
  hasBackground?: boolean;
  zIndex?: number;
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
  type: "Transparent" | "Colored";
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
  zIndex?: number;
};

type SavedDesign = {
  id?: string;
  user_id?: string;
  design_data: string;
  image_url: string;
  phone_model: string;
  case_type: string;
  color: string;
  created_at?: string;
};

// For history tracking
type HistoryAction = {
  type: "ADD" | "UPDATE" | "DELETE";
  elementType: "IMAGE" | "TEXT";
  data: any;
  previousData?: any;
};

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
];

function PhoneCaseEditor({
  phoneModel: initialPhoneModel,
  caseType,
  caseSecondType,
  type,
  color,
  modelIndex,
}: PhoneCaseEditorProps) {
  const { data: session } = useSession();
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
  const [images, setImages] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<SelectedShape>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null); // Track the text being edited

  // History tracking for undo/redo
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  const addTextElement = () => {
    const textId = `text-${uuidv4()}`;
    const newTextElement: TextElement = {
      id: textId,
      x: 50,
      y: 50,
      text: "Lorem Ipsum",
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
      zIndex: textElements.length + images.length + 1,
    };

    // Add to history
    addToHistory({
      type: "ADD",
      elementType: "TEXT",
      data: newTextElement,
    });

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
    const previousElement = textElements.find((text) => text.id === id);

    if (previousElement && !isUndoRedo) {
      // Add to history
      addToHistory({
        type: "UPDATE",
        elementType: "TEXT",
        data: { ...previousElement, ...newProps },
        previousData: previousElement,
      });
    }

    setTextElements(
      textElements.map((text) =>
        text.id === id ? { ...text, ...newProps } : text
      )
    );
  };

  // Helper function to add actions to history
  const addToHistory = (action: HistoryAction) => {
    if (isUndoRedo) return;

    const newHistory = [...history.slice(0, historyIndex + 1), action];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex < 0) return;

    setIsUndoRedo(true);
    const action = history[historyIndex];

    switch (action.type) {
      case "ADD":
        if (action.elementType === "IMAGE") {
          setImages(images.filter((img) => img.id !== action.data.id));
        } else if (action.elementType === "TEXT") {
          setTextElements(
            textElements.filter((text) => text.id !== action.data.id)
          );
        }
        break;
      case "UPDATE":
        if (action.elementType === "IMAGE" && action.previousData) {
          setImages(
            images.map((img) =>
              img.id === action.previousData.id ? action.previousData : img
            )
          );
        } else if (action.elementType === "TEXT" && action.previousData) {
          setTextElements(
            textElements.map((text) =>
              text.id === action.previousData.id ? action.previousData : text
            )
          );
        }
        break;
      case "DELETE":
        if (action.elementType === "IMAGE") {
          setImages([...images, action.data]);
        } else if (action.elementType === "TEXT") {
          setTextElements([...textElements, action.data]);
        }
        break;
    }

    setHistoryIndex(historyIndex - 1);
    setTimeout(() => setIsUndoRedo(false), 10);
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;

    setIsUndoRedo(true);
    const action = history[historyIndex + 1];

    switch (action.type) {
      case "ADD":
        if (action.elementType === "IMAGE") {
          setImages([...images, action.data]);
        } else if (action.elementType === "TEXT") {
          setTextElements([...textElements, action.data]);
        }
        break;
      case "UPDATE":
        if (action.elementType === "IMAGE") {
          setImages(
            images.map((img) => (img.id === action.data.id ? action.data : img))
          );
        } else if (action.elementType === "TEXT") {
          setTextElements(
            textElements.map((text) =>
              text.id === action.data.id ? action.data : text
            )
          );
        }
        break;
      case "DELETE":
        if (action.elementType === "IMAGE") {
          setImages(images.filter((img) => img.id !== action.data.id));
        } else if (action.elementType === "TEXT") {
          setTextElements(
            textElements.filter((text) => text.id !== action.data.id)
          );
        }
        break;
    }

    setHistoryIndex(historyIndex + 1);
    setTimeout(() => setIsUndoRedo(false), 10);
  };

  // Use the phoneModel prop to determine which image to load
  const [caseImage] = useImage(`/assets/frames/${iPhoneModelsImages[index]}`);
  const strokeColor = "#000";
  const isDraggable = action === ACTIONS.SELECT;

  const phoneCaseClip = {
    x: 0,
    y: 0,
    width: 300,
    height: 600,
  };

  // Function to handle shape selection
  const selectShape = (node: Konva.Node | null) => {
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }

    if (!node || node.id() === "bg" || node === transformerRef.current) {
      setSelectedShape(null);
      setSelectedImageId(null);
      return;
    }

    setSelectedShape({
      id: node.id(),
      type: node.getClassName(),
    });

    if (node.getClassName() === "Image") {
      setSelectedImageId(node.id());
    } else {
      setSelectedImageId(null);
    }

    if (transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  };

  function onPointerDown() {
    if (action === ACTIONS.SELECT) return;

    const stage = stageRef.current;
    if (!stage) return console.log("Stage not defined");
  }

  function onPointerMove() {
    if (action === ACTIONS.SELECT) return;

    const stage = stageRef.current;
    if (!stage) return console.log("Stage not defined");
  }

  function onPointerUp() {
    // Function kept for consistency
  }

  async function handleExport() {
    const stage = stageRef.current;
    if (!stage) return console.log("Stage not defined");

    // Create a zip file
    const zip = new JSZip();

    // Export the full stage as an image
    const fullStageUri = stage.toDataURL();
    const fullStageBase64 = fullStageUri.split(",")[1];
    zip.file("full_design.png", fullStageBase64, { base64: true });

    // Function to export a single node as PNG
    const exportNodeAsPNG = (node: Node<NodeConfig>) => {
      return new Promise((resolve) => {
        const tempStage = new Konva.Stage({
          width: node.width(),
          height: node.height(),
          container: document.createElement("div"),
        });
        const layer = new Konva.Layer();
        const clone = node.clone();
        layer.add(clone);
        tempStage.add(layer);

        // Ensure the node is centered in the temporary stage
        clone.position({
          x: tempStage.width() / 2,
          y: tempStage.height() / 2,
        });
        clone.offset({
          x: clone.width() / 2,
          y: clone.height() / 2,
        });

        layer.batchDraw();

        setTimeout(() => {
          const dataURL = tempStage.toDataURL();
          resolve(dataURL.split(",")[1]);
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
          zip.file(`${shapeType}_${i}.png`, pngData as string, {
            base64: true,
          });
        }
      }
    };

    await exportShapes(images, "image");

    // Generate the zip file
    const content = await zip.generateAsync({ type: "blob" });

    // Save the zip file
    saveAs(content, "design_export.zip");
  }

  // Updated onClick handler
  function onClick(e: { target: any; evt: any }) {
    if (action !== ACTIONS.SELECT) return;

    const shape = e.target;

    if (shape === stageRef.current || shape.id() === "bg") {
      selectShape(null); // Deselect the current shape
      return;
    }

    e.evt.cancelBubble = true;
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

    // Update the zIndex in state
    if (selectedShape?.type === "Image") {
      const updatedImage = images.find((img) => img.id === id);
      if (updatedImage) {
        const previousData = { ...updatedImage };
        const newZIndex = (updatedImage.zIndex || 0) + 1;

        // Add to history
        if (!isUndoRedo) {
          addToHistory({
            type: "UPDATE",
            elementType: "IMAGE",
            data: { ...updatedImage, zIndex: newZIndex },
            previousData,
          });
        }

        setImages(
          images.map((img) =>
            img.id === id ? { ...img, zIndex: newZIndex } : img
          )
        );
      }
    } else if (selectedShape?.type === "Text") {
      const updatedText = textElements.find((text) => text.id === id);
      if (updatedText) {
        const previousData = { ...updatedText };
        const newZIndex = (updatedText.zIndex || 0) + 1;

        // Add to history
        if (!isUndoRedo) {
          addToHistory({
            type: "UPDATE",
            elementType: "TEXT",
            data: { ...updatedText, zIndex: newZIndex },
            previousData,
          });
        }

        setTextElements(
          textElements.map((text) =>
            text.id === id ? { ...text, zIndex: newZIndex } : text
          )
        );
      }
    }
  }

  function sendBackward(id: string) {
    const shape = stageRef.current?.findOne(`#${id}`);
    shape?.moveDown();
    editLayerRef.current?.batchDraw();

    // Update the zIndex in state
    if (selectedShape?.type === "Image") {
      const updatedImage = images.find((img) => img.id === id);
      if (updatedImage) {
        const previousData = { ...updatedImage };
        const newZIndex = Math.max(0, (updatedImage.zIndex || 0) - 1);

        // Add to history
        if (!isUndoRedo) {
          addToHistory({
            type: "UPDATE",
            elementType: "IMAGE",
            data: { ...updatedImage, zIndex: newZIndex },
            previousData,
          });
        }

        setImages(
          images.map((img) =>
            img.id === id ? { ...img, zIndex: newZIndex } : img
          )
        );
      }
    } else if (selectedShape?.type === "Text") {
      const updatedText = textElements.find((text) => text.id === id);
      if (updatedText) {
        const previousData = { ...updatedText };
        const newZIndex = Math.max(0, (updatedText.zIndex || 0) - 1);

        // Add to history
        if (!isUndoRedo) {
          addToHistory({
            type: "UPDATE",
            elementType: "TEXT",
            data: { ...updatedText, zIndex: newZIndex },
            previousData,
          });
        }

        setTextElements(
          textElements.map((text) =>
            text.id === id ? { ...text, zIndex: newZIndex } : text
          )
        );
      }
    }
  }

  // Function to toggle background for selected image
  const toggleImageBackground = () => {
    if (selectedImageId) {
      const targetImage = images.find((img) => img.id === selectedImageId);
      if (targetImage) {
        const previousData = { ...targetImage };
        const updatedImage = {
          ...targetImage,
          hasBackground: !targetImage.hasBackground,
        };

        // Add to history if not during undo/redo
        if (!isUndoRedo) {
          addToHistory({
            type: "UPDATE",
            elementType: "IMAGE",
            data: updatedImage,
            previousData,
          });
        }

        setImages(
          images.map((img) => (img.id === selectedImageId ? updatedImage : img))
        );
      }
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleDelete() {
    if (selectedShape) {
      const { id, type } = selectedShape;

      switch (type) {
        case "Image":
          const deletedImage = images.find((img) => img.id === id);
          if (deletedImage && !isUndoRedo) {
            // Add to history
            addToHistory({
              type: "DELETE",
              elementType: "IMAGE",
              data: deletedImage,
            });
          }
          setImages((prevImages) =>
            prevImages.filter((image) => image.id !== id)
          );
          break;
        case "Text":
          const deletedText = textElements.find((text) => text.id === id);
          if (deletedText && !isUndoRedo) {
            // Add to history
            addToHistory({
              type: "DELETE",
              elementType: "TEXT",
              data: deletedText,
            });
          }
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

  // Function to handle text editing
  const handleTextEdit = (id: string, x: number, y: number, text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.top = `${y}px`;
    textarea.style.left = `${x}px`;
    textarea.style.fontSize = "24px";
    textarea.style.fontFamily = "Arial";
    textarea.style.color = "#000";
    textarea.style.zIndex = "1000";
    textarea.style.border = "1px solid #ccc";
    textarea.style.padding = "4px";
    textarea.style.resize = "none";
    textarea.style.background = "white";

    document.body.appendChild(textarea);
    textarea.focus();

    textarea.addEventListener("blur", () => {
      updateTextElement(id, { text: textarea.value });
      setEditingTextId(null);
      document.body.removeChild(textarea);
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        textarea.blur();
      }
    });

    setEditingTextId(id);
  };

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
    function handleKeyDown(e: { key: string }) {
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

        const newImage = {
          id,
          x: (phoneCaseClip.width - scaledDimensions.width) / 2, // Center horizontally
          y: (phoneCaseClip.height - scaledDimensions.height) / 2, // Center vertically
          width: scaledDimensions.width,
          height: scaledDimensions.height,
          image: img,
          fillColor: fillColor,
          hasBackground: true,
          zIndex: images.length + textElements.length + 1,
        };

        // Add to history
        if (!isUndoRedo) {
          addToHistory({
            type: "ADD",
            elementType: "IMAGE",
            data: { ...newImage, image: undefined }, // Don't store the actual image in history
          });
        }

        setImages((prevImages) => [...prevImages, newImage]);

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

  function scaleImage(
    img: HTMLImageElement,
    maxWidth: number,
    maxHeight: number
  ) {
    const ratioX = maxWidth / img.width;
    const ratioY = maxHeight / img.height;
    const ratio = Math.min(ratioX, ratioY);

    return {
      width: img.width * ratio,
      height: img.height * ratio,
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
    const imagesWithBase64 = images.map((image) => {
      const base64 = image.image ? image.image.src : "";
      return {
        ...image,
        base64,
        image: undefined, // Remove the image object as it can't be serialized
      };
    });

    const designData = {
      images: imagesWithBase64,
      textElements,
    };

    return {
      designJSON: JSON.stringify(designData),
      designImage: designImageDataURL,
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
      const userId = session?.user?.email;
      console.log("Current User: ", userId);

      // 1. Upload the image to Supabase Storage
      const imageFile = await fetch(designData.designImage).then((res) =>
        res.blob()
      );
      const imageFileName = `design-images/${userId}/${uuidv4()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("phone-case-designs")
        .upload(imageFileName, imageFile);

      if (uploadError) {
        throw new Error(
          "Failed to upload design image: " + uploadError.message
        );
      }

      // Get the public URL for the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("phone-case-designs")
        .getPublicUrl(imageFileName);

      // 2. Save the design data to the database
      const savedDesign: SavedDesign = {
        user_id: userId || undefined,
        design_data: designData.designJSON,
        image_url: publicUrl,
        phone_model: phoneModel,
        case_type: `${caseType} ${caseSecondType}`,
        color: color,
      };

      const { data, error } = await supabase
        .from("designs")
        .insert(savedDesign)
        .select();

      if (error) {
        throw new Error("Failed to save design: " + error.message);
      }

      // 3. Redirect to dashboard
      router.push("/dashboard");
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || "guest-" + uuidv4();

      // 1. Upload the image to Supabase Storage
      const imageFile = await fetch(designData.designImage).then((res) =>
        res.blob()
      );
      const imageFileName = `design-images/${userId}/${uuidv4()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("phone-case-designs")
        .upload(imageFileName, imageFile);

      if (uploadError) {
        throw new Error(
          "Failed to upload design image: " + uploadError.message
        );
      }

      // Get the public URL for the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("phone-case-designs")
        .getPublicUrl(imageFileName);

      // 2. Save the design data to the database
      const savedDesign: SavedDesign = {
        user_id: userId,
        design_data: designData.designJSON,
        image_url: publicUrl,
        phone_model: phoneModel,
        case_type: `${caseType} ${caseSecondType}`,
        color: color,
      };

      const { data, error } = await supabase
        .from("designs")
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

  const [showLayerControls, setShowLayerControls] = useState(false); // State to toggle layer controls

  return (
    <div>
      <div className="relative w-full h-screen overflow-hidden">
        <div className="absolute bottom-5 z-10 w-full py-2 md:top-0">
          <div className="flex py-2 px-3">
            {/* Undo/Redo buttons */}
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={handleUndo}
              disabled={historyIndex < 0}
              title="Undo"
            >
              <LuUndo2 size={"2.75rem"} />
            </button>
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <LuRedo2 size={"2.75rem"} />
            </button>
          </div>
          <div className="flex justify-center items-center gap-3 py-2 px-3 w-fit mx-auto border shadow-lg rounded-lg bg-gradient-to-r from-pink/70 to-cyan-300/70 ">
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={addTextElement}
              title="Add Text"
            >
              <MdOutlineTextFields size={"2rem"} />
              <p>Text</p>
            </button>
            {/* <button>
              <input
                className="w-6 h-6"
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                title="Choose Color"
              />
            </button> */}

            <button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="hover:bg-violet-100 cursor-pointer flex flex-col items-center"
                title="Upload Image"
              >
                <FaImage size={"2rem"} />
                <p>Image</p>
              </label>
            </button>

            {/* Layer Control Button */}
            <div className="relative">
              <button
                className="p-1 hover:bg-violet-100 rounded flex flex-col items-center"
                onClick={() => setShowLayerControls(!showLayerControls)}
                title="Layer Controls"
              >
                <MdLayers size={"2rem"} />
                <p>Position</p>
              </button>

              {/* Popup for Layer Controls */}
              {showLayerControls && (
                <div className="absolute -top-16 left-0 bg-white shadow-lg border rounded-lg p-2 flex flex-row gap-2 z-20">
                  <button
                    className="p-1 hover:bg-violet-100 rounded"
                    onClick={() =>
                      selectedShape && bringForward(selectedShape.id)
                    }
                    title="Bring Forward"
                    disabled={!selectedShape}
                  >
                    <MdLayers size={"2rem"} />
                    {/* <span className="ml-2">Bring Forward</span> */}
                  </button>
                  <button
                    className="p-1 hover:bg-violet-100 rounded"
                    onClick={() =>
                      selectedShape && sendBackward(selectedShape.id)
                    }
                    title="Send Backward"
                    disabled={!selectedShape}
                  >
                    <MdLayers size={"1.75rem"} style={{ opacity: 0.6 }} />
                    {/* <span className="ml-2">Send Backward</span> */}
                  </button>
                </div>
              )}
            </div>

            <button
              className={`p-1 hover:bg-violet-100 rounded flex flex-col items-center ${
                selectedImageId ? "" : "opacity-50"
              }`}
              onClick={toggleImageBackground}
              disabled={!selectedImageId}
              title="Toggle Background"
            >
              <MdOutlineRemoveCircleOutline size={"2rem"} />
              <p>Remove BG</p>
            </button>

            <button
              className="p-1 hover:bg-violet-100 rounded flex flex-col items-center"
              onClick={handleDelete}
              title="Delete"
            >
              <IoMdTrash size={"2rem"} />
              <p>Delete</p>
            </button>
            {/* <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={() => handleExport().catch(console.error)}
              title="Download"
            >
              <IoMdDownload size={"2rem"} />
            </button> */}
            <div className="max-md:hidden flex">
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

        <div className="max-md:flex hidden top-5 z-20 right-5 absolute gap-2">
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

        <div className="flex justify-center items-center w-full h-full pt-20 max-md:-mt-10 max-md:pt-0">
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
              {type === "Colored" && (
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
              {/* Updated draggable behavior for images */}
              {images.map((image) =>
                image.image ? (
                  <KonvaImage
                    key={image.id}
                    id={image.id}
                    image={image.image}
                    x={image.x}
                    y={image.y}
                    width={image.width}
                    height={image.height}
                    draggable={action === ACTIONS.SELECT}
                    onClick={handleShapeClick}
                    onDragEnd={(e) => {
                      const previousImage = images.find(
                        (img) => img.id === image.id
                      );
                      if (previousImage && !isUndoRedo) {
                        addToHistory({
                          type: "UPDATE",
                          elementType: "IMAGE",
                          data: { ...image, x: e.target.x(), y: e.target.y() },
                          previousData: previousImage,
                        });
                      }
                      setImages(
                        images.map((img) =>
                          img.id === image.id
                            ? { ...img, x: e.target.x(), y: e.target.y() }
                            : img
                        )
                      );
                    }}
                    onTransform={(e) => {
                      // Update image on transform
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();

                      // Reset scale to avoid accumulation
                      node.scaleX(1);
                      node.scaleY(1);

                      const updatedImage = {
                        ...image,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                      };

                      setImages(
                        images.map((img) =>
                          img.id === image.id ? updatedImage : img
                        )
                      );
                    }}
                    onTransformEnd={(e) => {
                      // Save to history after transform is complete
                      const previousImage = images.find(
                        (img) => img.id === image.id
                      );
                      const node = e.target;

                      if (previousImage && !isUndoRedo) {
                        const updatedImage = {
                          ...image,
                          x: node.x(),
                          y: node.y(),
                          width: node.width() * node.scaleX(),
                          height: node.height() * node.scaleY(),
                        };

                        addToHistory({
                          type: "UPDATE",
                          elementType: "IMAGE",
                          data: updatedImage,
                          previousData: previousImage,
                        });
                      }
                    }}
                  />
                ) : null
              )}
              {/* Updated draggable behavior for text */}
              {textElements.map((text) => (
                <Text
                  key={text.id}
                  id={text.id}
                  x={text.x}
                  y={text.y}
                  text={text.text}
                  fontSize={text.fontSize}
                  fontFamily={text.fontFamily}
                  fill={text.fill}
                  draggable={action === ACTIONS.SELECT}
                  onDragEnd={(e) => {
                    updateTextElement(text.id, {
                      x: e.target.x(),
                      y: e.target.y(),
                    });
                  }}
                  onClick={handleShapeClick}
                  onTap={(e) => {
                    const stageBox = stageRef.current
                      ?.container()
                      .getBoundingClientRect();
                    if (stageBox) {
                      handleTextEdit(
                        text.id,
                        stageBox.left + e.target.x(),
                        stageBox.top + e.target.y(),
                        text.text
                      );
                    }
                  }}
                  onTransform={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();

                    // Reset scale to avoid accumulation
                    node.scaleX(1);
                    node.scaleY(1);

                    updateTextElement(text.id, {
                      x: node.x(),
                      y: node.y(),
                      fontSize: Math.max(12, text.fontSize * scaleX),
                    });
                  }}
                />
              ))}
              <Transformer
                ref={transformerRef}
                rotateEnabled={true}
                resizeEnabled={true}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
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
