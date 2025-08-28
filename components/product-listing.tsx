'use client'

import React, { useEffect, useState } from 'react';
import ItemCard from "./item-card";
import { getDesignsByBrand, CaseStyle } from '@/lib/database/styles';
import Image from 'next/image';

type Product = {
    productId: number;
    product: string;
    thumbnail?: string;
}

export default function ProductListing() {
    const [brands, setBrands] = useState<Product[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [availableModels, setAvailableModels] = useState<CaseStyle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get all unique brands from case_styles
    useEffect(() => {
        const getBrands = async () => {
            setLoading(true);
            setError(null);
            try {
                // Get all designs (passing empty string to get all records)
                const designs = await getDesignsByBrand('');
                
                if (designs) {
                    // Create a map to store unique brands with their first thumbnail
                    const brandMap = new Map<string, string>();
                    
                    designs.forEach(design => {
                        if (design.phoneBrand && !brandMap.has(design.phoneBrand)) {
                            brandMap.set(design.phoneBrand, design.thumbnail || '');
                        }
                    });

                    // Convert map to array of products and sort alphabetically
                    const uniqueBrands = Array.from(brandMap.entries())
                        .map(([brand, thumbnail], index) => ({
                            productId: index + 1,
                            product: brand,
                            thumbnail
                        }))
                        .sort((a, b) => a.product.localeCompare(b.product));

                    setBrands(uniqueBrands);
                }
            } catch (error) {
                console.error('Error fetching brands:', error);
                setError('Failed to load brands');
            } finally {
                setLoading(false);
            }
        };
        getBrands();
    }, []);

    // When a brand is selected, get its available models
    useEffect(() => {
        const getModelsForBrand = async () => {
            if (!selectedBrand) {
                setAvailableModels([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const designs = await getDesignsByBrand(selectedBrand);
                if (designs) {
                    // Sort models alphabetically
                    const sortedModels = [...designs].sort((a, b) => 
                        (a.phoneModel || '').localeCompare(b.phoneModel || '')
                    );
                    setAvailableModels(sortedModels);
                }
            } catch (error) {
                console.error('Error fetching models:', error);
                setError('Failed to load models');
            } finally {
                setLoading(false);
            }
        };

        getModelsForBrand();
    }, [selectedBrand]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-start bg-white">
            <p className="mt-20 font-Poppins text-sm md:text-[30px] text-[#A594F6]">Select Your Phone Brand</p>
            
            {error && (
                <div className="text-red-500 mt-4">{error}</div>
            )}

            {loading ? (
                <div className="mt-4">Loading...</div>
            ) : (
                <>
                    <div className="w-[1200px] h-full flex flex-row flex-wrap items-start justify-center my-14">
                        {brands.map((brand, index) => (
                            <div 
                                key={index}
                                onClick={() => setSelectedBrand(brand.product)}
                                className={`cursor-pointer ${selectedBrand === brand.product ? 'ring-2 ring-[#A594F6]' : ''}`}
                            >
                                <ItemCard 
                                    productName={brand.product} 
                                    productId={brand.productId} 
                                    index={index}
                                    thumbnail={brand.thumbnail}
                                />
                            </div>
                        ))}
                    </div>

                    {selectedBrand && availableModels.length > 0 && (
                        <div className="w-[1200px] mt-8">
                            <h2 className="text-2xl font-Loubag text-[#A594F6] mb-4">
                                Available Models for {selectedBrand}
                            </h2>
                            <div className="grid grid-cols-4 gap-4">
                                {availableModels.map((model, index) => (
                                    <div 
                                        key={index}
                                        className="p-4 border rounded-lg hover:shadow-lg transition-shadow"
                                    >
                                        {model.thumbnail && (
                                            <div className="relative w-full aspect-square mb-4">
                                                <Image
                                                    src={model.thumbnail}
                                                    alt={model.phoneModel || 'Phone model'}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        )}
                                        <p className="text-center font-Poppins">{model.phoneModel}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}