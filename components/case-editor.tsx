'use client';


import dynamic from 'next/dynamic';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { TbRectangle } from "react-icons/tb";
import { IoMdDownload } from "react-icons/io";
import { FaLongArrowAltRight, FaImage } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import { GiArrowCursor } from "react-icons/gi";
import { FaRegCircle } from "react-icons/fa6";
import { IoMdTrash } from "react-icons/io";
import { useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Arrow,
    Circle,
    Layer,
    Line,
    Rect,
    Stage,
    Transformer,
    Image as KonvaImage
} from "react-konva";
import { ACTIONS } from "../constants";
import useImage from 'use-image';
import Konva from 'konva';

// Define types for the shapes and actions
type ShapeType = 'RECTANGLE' | 'CIRCLE' | 'ARROW' | 'SCRIBBLE';
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
    type: 'transparent' | 'colored';
    color: string;
    phoneModel: string;
    };

function PhoneCaseEditor({ type, color, phoneModel }: PhoneCaseEditorProps) {
    const stageRef = useRef<Konva.Stage>(null);
    const [action, setAction] = useState<ShapeType | string>(ACTIONS.SELECT);
    const [fillColor, setFillColor] = useState<string>("#ff0000");
    const [rectangles, setRectangles] = useState<Shape[]>([]);
    const [circles, setCircles] = useState<Shape[]>([]);
    const [arrows, setArrows] = useState<Shape[]>([]);
    const [scribbles, setScribbles] = useState<Shape[]>([]);
    const [images, setImages] = useState<Shape[]>([]);
    const [selectedShape, setSelectedShape] = useState<SelectedShape>(null);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    // Use the phoneModel prop to determine which image to load
    const [caseImage] = useImage(`/iphone/${phoneModel}.png`);
    const strokeColor = "#000";
    const isPainting = useRef(false);
    const currentShapeId = useRef<string | undefined>();
    const transformerRef = useRef<Konva.Transformer>(null);
    const isDraggable = action === ACTIONS.SELECT;

    const phoneCaseClip = {
        x: 0,
        y: 0,
        width: 300,
        height: 600,
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
      case ACTIONS.RECTANGLE:
        setRectangles((rectangles) => [
          ...rectangles,
          {
            id,
            x,
            y,
            height: 20,
            width: 20,
            fillColor,
          },
        ]);
        break;
      case ACTIONS.CIRCLE:
        setCircles((circles) => [
          ...circles,
          {
            id,
            x,
            y,
            radius: 20,
            fillColor,
          },
        ]);
        break;
      case ACTIONS.ARROW:
        setArrows((arrows) => [
          ...arrows,
          {
            id,
            x,
            y,
            points: [x, y, x + 20, y + 20],
            fillColor,
          },
        ]);
        break;
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
      case ACTIONS.RECTANGLE:
        setRectangles((rectangles) =>
          rectangles.map((rectangle) => {
            if (rectangle.id === currentShapeId.current) {
              return {
                ...rectangle,
                width: x - rectangle.x,
                height: y - rectangle.y,
              };
            }
            return rectangle;
          })
        );
        break;
      case ACTIONS.CIRCLE:
        setCircles((circles) =>
          circles.map((circle) => {
            if (circle.id === currentShapeId.current) {
              return {
                ...circle,
                radius: Math.sqrt(
                  Math.pow(y - circle.y, 2) + Math.pow(x - circle.x, 2)
                ),
              };
            }
            return circle;
          })
        );
        break;
      case ACTIONS.ARROW:
        setArrows((arrows) =>
          arrows.map((arrow) => {
            if (arrow.id === currentShapeId.current) {
              return {
                ...arrow,
                points: arrow.points ? [arrow.points[0], arrow.points[1], x, y] : [],
              };
            }
            return arrow;
          })
        );
        break;
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
  const exportNodeAsPNG = (node) => {
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
  const exportShapes = async (shapes, shapeType) => {
    for (let i = 0; i < shapes.length; i++) {
      const shape = stage.findOne(`#${shapes[i].id}`);
      if (shape) {
        const pngData = await exportNodeAsPNG(shape);
        zip.file(`${shapeType}_${i}.png`, pngData, {base64: true});
      }
    }
  };

  // Export all shape types
  await exportShapes(rectangles, 'rectangle');
  await exportShapes(circles, 'circle');
  await exportShapes(arrows, 'arrow');
  await exportShapes(scribbles, 'scribble');
  await exportShapes(images, 'image');

  // Generate the zip file
  const content = await zip.generateAsync({type: "blob"});

  // Save the zip file
  saveAs(content, "design_export.zip");
}

  function onClick(e: { target: any; }) {
    if (action !== ACTIONS.SELECT) return;
    const shape = e.target;

    console.log(shape.className);

    if (shape.id() !== 'bg') {
      setSelectedShape({
        id: shape.id(),
        type: shape.className,
      });
      setSelectedImageId(null);

      transformerRef.current?.nodes([shape]);
      transformerRef.current?.getLayer()?.batchDraw();
    } else {
      setSelectedShape(null);
      setSelectedImageId(null);
      transformerRef.current?.nodes([]);
    }
  }

  function handleShapeClick(e : any) {
    e.cancelBubble = true;
    onClick(e);
  }

  // function scaleImage(img: HTMLImageElement, maxWidth: number, maxHeight: number) {
  //   let ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  //   return { width: img.width * ratio, height: img.height * ratio };
  // }


  function bringForward(id: string) {
  const shape = stageRef.current?.findOne(`#${id}`);
  shape?.moveUp();
}

function sendBackward(id: string) {
  const shape = stageRef.current?.findOne(`#${id}`);
  shape?.moveDown();
}

  

  function handleDelete() {
    if (selectedShape) {
      const { id, type } = selectedShape;

      switch (type) {
        case 'Rect':
          setRectangles((prevRectangles) =>
            prevRectangles.filter((rect) => rect.id !== id)
          );
          break;
        case 'Circle':
          setCircles((prevCircles) =>
            prevCircles.filter((circle) => circle.id !== id)
          );
          break;
        case 'Arrow':
          setArrows((prevArrows) =>
            prevArrows.filter((arrow) => arrow.id !== id)
          );
          break;
        case 'Line':
          setScribbles((prevScribbles) =>
            prevScribbles.filter((scribble) => scribble.id !== id)
          );
          break;
        case 'Image':
          setImages((prevImages) =>
            prevImages.filter((image) => image.id !== id)
          );
        default:
          break;
      }

      transformerRef.current?.nodes([]);
      setSelectedShape(null);
    } 
  }

  useEffect(() => {
    function handleKeyDown(e: { key: string; }) {
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete, selectedShape, selectedImageId]);

  const handleModelSelect = (model : any) => {
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

  function handleSave() {
    const imagesWithBase64 = images.map(image => {
      const base64 = image.image ? image.image.src : '';
      return {
        ...image,
        base64,
        image: undefined // Remove the image object as it can't be serialized
      };
    });
  
    const designData = {
      rectangles,
      circles,
      arrows,
      scribbles,
      images: imagesWithBase64,
    };
  
    const json = JSON.stringify(designData);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "design.json";
    link.click();
  }
  

  function handleLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target) {
        const designData = JSON.parse(event.target.result);
  
        setRectangles(designData.rectangles || []);
        setCircles(designData.circles || []);
        setArrows(designData.arrows || []);
        setScribbles(designData.scribbles || []);
  
        // Recreate image objects from base64 data
        const loadedImages = (designData.images || []).map((imgData) => {
          if (imgData.base64) {
            const img = new Image();
            img.src = imgData.base64;
            return { ...imgData, image: img };
          }
          return imgData;
        });
  
        setImages(loadedImages);
      }
    };
    reader.readAsText(file);
  }
  

  if (!phoneModel) {
    return <PhoneCaseSelection onSelect={handleModelSelect} />;
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
                action === ACTIONS.RECTANGLE
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => setAction(ACTIONS.RECTANGLE)}
            >
              <TbRectangle size={"2rem"} />
            </button>
            <button
              className={
                action === ACTIONS.CIRCLE
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => setAction(ACTIONS.CIRCLE)}
            >
              <FaRegCircle size={"2rem"} />
            </button>
            <button
              className={
                action === ACTIONS.ARROW
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => setAction(ACTIONS.ARROW)}
            >
              <FaLongArrowAltRight size={"2rem"} />
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
              <label htmlFor="image-upload">
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
            <button
              className="p-1 hover:bg-violet-100 rounded"
              onClick={handleSave}
            >
              Save Design
            </button>
            <input
              type="file"
              accept="application/json"
              onChange={handleLoad}
              style={{ display: "none" }}
              id="load-design"
            />
            <label htmlFor="load-design" className="p-1 hover:bg-violet-100 rounded">
              Load Design
            </label>

          </div>
        </div>
        <Stage
          width={phoneCaseClip.width}
          height={phoneCaseClip.height}
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onClick}
        >
          <Layer>
            {type === 'colored' && (
                <Rect
                    x={0}
                    y={0}
                    width={phoneCaseClip.width}
                    height={phoneCaseClip.height}
                    fill={color}
                />
            )}
            {rectangles.map((rect) => (
              <Rect
                key={rect.id}
                id={rect.id}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill={rect.fillColor}
                stroke={strokeColor}
                draggable={isDraggable}
                onClick={handleShapeClick}
              />
            ))}
            {circles.map((circle) => (
              <Circle
                key={circle.id}
                id={circle.id}
                x={circle.x}
                y={circle.y}
                radius={circle.radius}
                fill={circle.fillColor}
                stroke={strokeColor}
                draggable={isDraggable}
                onClick={handleShapeClick}
              />
            ))}
            {arrows.map((arrow) => (
              <Arrow
                key={arrow.id}
                id={arrow.id}
                points={arrow.points || []}
                fill={arrow.fillColor}
                stroke={arrow.fillColor}
                draggable={isDraggable}
                onClick={handleShapeClick}
              />
            ))}
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
              image.image ? (  // Ensure the image object is defined
                <KonvaImage
                  key={image.id}
                  id={image.id}
                  image={image.image}  // This should be an HTMLImageElement
                  x={image.x}
                  y={image.y}
                  width={image.width}
                  height={image.height}
                  draggable={isDraggable}
                  onClick={handleShapeClick}
                />
              ) : null  // Don't render if the image is not loaded
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
            />

          </Layer>
          <Layer>
            <KonvaImage
              id="bg"
              image={caseImage}
              width={phoneCaseClip.width}
              height={phoneCaseClip.height}
              listening={false}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(PhoneCaseEditor), { ssr: false });
