'use client'

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { type } from "os";
import { Stage, Layer, Rect, Circle, Arrow, Line, Transformer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "use-image";

const phoneCaseClip = {
    x: 0,
    y: 0,
    width: 300,
    height: 600,
};

type DesignData = {
    rectangles?: Konva.RectConfig[];
    circles?: Konva.CircleConfig[];
    arrows?: Konva.ArrowConfig[];
    scribbles?: Konva.LineConfig[];
    images?: { base64: string }[];
}

export default function UserDashboard() {
    const stageRef = useRef<Konva.Stage>(null);
    const { data: session, status } = useSession();
    const [designs, setDesigns] = useState<
        { design_file: JSON; phone_model?: string, user_email?: string } | null
    >();
    const [rectangles, setRectangles] = useState<Konva.RectConfig[]>([]);
    const [circles, setCircles] = useState<Konva.CircleConfig[]>([]);
    const [arrows, setArrows] = useState<Konva.ArrowConfig[]>([]);
    const [scribbles, setScribbles] = useState<Konva.LineConfig[]>([]);
    const [images, setImages] = useState<
        { id: string; base64: string; image: HTMLImageElement; x: number; y: number; width: number; height: number }[]
    >([]);
    const [caseImage, setCaseImage] = useState<HTMLImageElement>();
    const [phoneModel, setPhoneModel] = useState<string | null>(null);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
    const strokeColor = "#000";

    const fetchDesigns = async () => {
        if (session?.user?.email) {
            const res = await fetch("/api/get-saved-cases", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: session.user.email,
                }),
            });

            const result = await res.json();
            console.log(result.design);
            setDesigns(result.design[0]);
            if (result.design[0].phone_model) {
                setPhoneModel(result.design[0].phone_model);
            }
        }
    }

    useEffect(() => {
        if (phoneModel) {
            const loadImage = new window.Image();
            loadImage.crossOrigin = "Anonymous";
            loadImage.src = phoneModel;
            loadImage.onload = () => setImageElement(loadImage);
        }
    }, [phoneModel]);

    useEffect(() => {
        if (imageElement) {
            setCaseImage(imageElement);
        }
    }, [imageElement]);

    useEffect(() => {
        fetchDesigns();
    }, [session]);

    function handleLoad() {

        if (designs) {
            const designData = designs.design_file as DesignData;
            setRectangles(designData.rectangles || []);
            setCircles(designData.circles || []);
            setArrows(designData.arrows || []);
            setScribbles(designData.scribbles || []);

            const loadedImages = (designData.images || []).map((imgData: { base64: string }) => {
                const img = new Image();
                img.src = imgData.base64;

                return {
                    id: crypto.randomUUID(), // Generate a unique ID
                    base64: imgData.base64,
                    image: img,
                    x: 200, // Set a default random position
                    y: 200,
                    width: 100, // Default width
                    height: 100, // Default height
                };
            });

            setImages(loadedImages);
        }
    }

    useEffect(() => {
        handleLoad();
    }, [designs])

    return (
        <div className="w-full h-screen flex flex-col items-center justify-start">
            <div className="w-full h-1/6 bg-[#7359b5] flex flex-col items-center justify-center">
                <p className="drop-shadow-md text-[28px] text-white font-Poppins font-black">User Dashboard</p>
            </div>

            <div className='flex justify-start items-start w-full h-full p-20'>


                <Stage
                    width={phoneCaseClip.width * 0.2}  // Adjust the width (e.g., 50% smaller)
                    height={phoneCaseClip.height * 0.2} // Adjust the height
                    ref={stageRef}
                    scale={{ x: 0.2, y: 0.2 }}  // Apply the same scale factor to shrink the canvas
                >
                    <Layer>
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
                                draggable={false}

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
                                draggable={false}

                            />
                        ))}
                        {arrows.map((arrow) => (
                            <Arrow
                                key={arrow.id}
                                id={arrow.id}
                                points={arrow.points || []}
                                fill={arrow.fillColor}
                                stroke={arrow.fillColor}
                                draggable={false}

                            />
                        ))}
                        {scribbles.map((scribble) => (
                            <Line
                                key={scribble.id}
                                id={scribble.id}
                                points={scribble.points}
                                stroke={scribble.fillColor}
                                strokeWidth={4}
                                draggable={false}

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
                                    draggable={false}

                                />
                            ) : null  // Don't render if the image is not loaded
                        ))}

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