'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Gallery() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    // This would be replaced with actual images from /public/assets/gallery
    const galleryImages = [
        '/assets/gallery/1.jpg',
        '/assets/gallery/2.jpg',
        '/assets/gallery/3.jpg',
        '/assets/gallery/4.jpg',
        '/assets/gallery/5.jpg',
        '/assets/gallery/6.jpg',
        '/assets/gallery/7.jpg',
    ];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const previousImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    // Auto-scroll effect
    useEffect(() => {
        if (!isAutoScrolling) return;

        const interval = setInterval(() => {
            nextImage();
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(interval);
    }, [isAutoScrolling, currentImageIndex]);

    // Pause auto-scroll when user interacts
    const handleUserInteraction = () => {
        setIsAutoScrolling(false);
        // Resume auto-scroll after 5 seconds of no interaction
        setTimeout(() => setIsAutoScrolling(true), 5000);
    };

    return (
        <div className="w-full py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                {/* Title */}
                <h2 className="text-center font-Poppins text-md lg:text-xl mb-6">
                    Case Gallery
                </h2>

                {/* Gallery Container */}
                <div className="relative">
                    {/* Main Image */}
                    <div className="relative w-full max-w-2xl mx-auto aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                            src={galleryImages[currentImageIndex]}
                            alt={`Gallery image ${currentImageIndex + 1}`}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={() => {
                            previousImage();
                            handleUserInteraction();
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                        aria-label="Previous image"
                    >
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={() => {
                            nextImage();
                            handleUserInteraction();
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                        aria-label="Next image"
                    >
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {galleryImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentImageIndex(index);
                                    handleUserInteraction();
                                }}
                                className={`w-3 h-3 rounded-full transition-colors ${
                                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 