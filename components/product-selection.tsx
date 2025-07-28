'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SimpleGrid, Image, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { getDesignsByBrand, CaseStyle } from '@/lib/database/styles';
import { IoHelpCircle } from "react-icons/io5";

type CaseType = 'Transparent' | 'Colored';

type SelectedOptions = {
    type: CaseType;
    color: string;
    phoneModel: string;
    material: string;
}

interface ProductSelectionProps {
    onSubmit: (options: {
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
    }) => void;
}

export default function ProductSelection({ onSubmit }: ProductSelectionProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get('productId');

    const [brands, setBrands] = useState<{ displayName: string; originalName: string }[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [availableModels, setAvailableModels] = useState<CaseStyle[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [availableMaterials, setAvailableMaterials] = useState<{ material: string; thumbnail: string; minPrice: number | null; maxPrice: number | null }[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<string>('');
    const [availableColors, setAvailableColors] = useState<{ color: string; thumbnail: string; price: number | null }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [designs, setDesigns] = useState<CaseStyle[]>([]);

    const capitalizeFirstLetter = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const formatPrice = (price: number | null) => {
        if (price === null) return '';
        return `$${price.toFixed(2)}`;
    };

    const getMaterialTooltip = (material: string) => {
        const materialLower = material.toLowerCase();
        console.log('Getting tooltip for material:', material, materialLower);
        
        if (materialLower.includes('clear') && materialLower.includes('airbag')) {
            return "Transparent with reinforced 4-corner airbag protection for added drop resistance\n\nKeep your phone safe and stylish!";
        } else if (materialLower.includes('clear')) {
            return "A simple, durable clear case with straight edges\n\nPerfect for showcasing your design while keeping your phone protected.";
        } else if (materialLower.includes('silicone')) {
            return "A soft, smooth, and flexible silicone case for a comfortable grip.\n\nAvailable in 10 colors to match any style!";
        } else if (materialLower.includes('holo')) {
            return "Matte holographic finish that shifts colors under light.\n\nAvoid covering the entire case with your design to keep the holo effect visible!";
        } else if (materialLower.includes('wrapped') || materialLower.includes('full wrapped')) {
            return "Design covers the entire case! Available in hard or soft shell.\n\nMake sure your design fills the whole area, so adding a colored background is recommended!";
        } else if (materialLower.includes('mirror')) {
            return "A mirror finish that's both stylish and practical!\n\nKeep areas clear in your design for the mirror effect, covering the whole case will hide it!";
        }
        
        return "Select this material for your phone case.";
    };

    // Get all unique brands from case_styles
    useEffect(() => {
        const getBrands = async () => {
            setLoading(true);
            setError(null);
            try {
                const designs = await getDesignsByBrand('');
                
                if (designs) {
                    // Extract unique brands and sort alphabetically
                    const uniqueBrands = Array.from(new Set<string | null>(designs
                        .map((design: CaseStyle) => design.phoneBrand)))
                        .filter((brand): brand is string => brand !== null)
                        .map(brand => ({
                            displayName: capitalizeFirstLetter(brand),
                            originalName: brand.toLowerCase()
                        }))
                        .sort((a, b) => a.displayName.localeCompare(b.displayName));

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

            try {
                const designs = await getDesignsByBrand(selectedBrand);
                if (designs) {
                    // Get unique phone models and sort alphabetically
                    const uniqueModels = Array.from(new Set<string | null>(designs
                        .map((design: CaseStyle) => design.phoneModel)))
                        .filter((model): model is string => model !== null)
                        .map(model => capitalizeFirstLetter(model))
                        .sort((a, b) => a.localeCompare(b));

                    // Create CaseStyle objects for each unique model with their prices
                    const modelStyles: CaseStyle[] = uniqueModels.map(model => {
                        const modelDesign = designs.find((design: CaseStyle) => 
                            design.phoneModel?.toLowerCase() === model.toLowerCase()
                        );
                        return {
                            id: modelDesign?.id || 0,
                            phoneModel: model,
                            phoneBrand: selectedBrand,
                            thumbnail: modelDesign?.thumbnail || '',
                            color: null,
                            material: null,
                            seller: modelDesign?.seller || '',
                            type: null,
                            variation: null,
                            price: modelDesign?.price || null,
                            mockup: modelDesign?.mockup || null
                        };
                    });

                    setAvailableModels(modelStyles);
                }
            } catch (error) {
                console.error('Error fetching models:', error);
                setError('Failed to load models');
            }
        };

        getModelsForBrand();
    }, [selectedBrand]);

    // When a model is selected, get its available materials
    useEffect(() => {
        const getMaterialsForModel = async () => {
            if (!selectedModel || !selectedBrand) {
                setAvailableMaterials([]);
                return;
            }

            try {
                const designs = await getDesignsByBrand(selectedBrand);
                if (designs) {
                    // Filter designs for selected model and get unique materials
                    const modelDesigns = designs.filter((design: CaseStyle) => 
                        design.phoneModel?.toLowerCase() === selectedModel.toLowerCase()
                    );

                    // Create a map to store unique materials with their thumbnails and price ranges
                    const materialMap = new Map<string, { 
                        thumbnail: string; 
                        minPrice: number | null;
                        maxPrice: number | null;
                    }>();
                    
                    modelDesigns.forEach((design: CaseStyle) => {
                        if (design.material) {
                            const current = materialMap.get(design.material) || {
                                thumbnail: design.thumbnail || '',
                                minPrice: design.price,
                                maxPrice: design.price
                            };
                            
                            if (design.price !== null) {
                                current.minPrice = current.minPrice === null ? design.price : Math.min(current.minPrice, design.price);
                                current.maxPrice = current.maxPrice === null ? design.price : Math.max(current.maxPrice, design.price);
                            }
                            
                            materialMap.set(design.material, current);
                        }
                    });

                    // Convert map to array and sort alphabetically
                    const materials = Array.from(materialMap.entries())
                        .map(([material, data]) => ({
                            material: capitalizeFirstLetter(material),
                            thumbnail: data.thumbnail,
                            minPrice: data.minPrice,
                            maxPrice: data.maxPrice
                        }))
                        .sort((a, b) => a.material.localeCompare(b.material));

                    setAvailableMaterials(materials);
                }
            } catch (error) {
                console.error('Error fetching materials:', error);
                setError('Failed to load materials');
            }
        };

        getMaterialsForModel();
    }, [selectedModel, selectedBrand]);

    // When a material is selected, get its available colors
    useEffect(() => {
        const getColorsForMaterial = async () => {
            if (!selectedModel || !selectedBrand || !selectedMaterial) {
                setAvailableColors([]);
                setDesigns([]);
                return;
            }

            try {
                const allDesigns = await getDesignsByBrand(selectedBrand);
                if (allDesigns) {
                    // Filter designs for selected model and material
                    const materialDesigns = allDesigns.filter((design: CaseStyle) => 
                        design.phoneModel?.toLowerCase() === selectedModel.toLowerCase() &&
                        design.material?.toLowerCase() === selectedMaterial.toLowerCase()
                    );

                    // Store the filtered designs
                    setDesigns(materialDesigns);

                    // Create a map to store unique colors with their thumbnails and prices
                    const colorMap = new Map<string, { thumbnail: string; price: number | null }>();
                    materialDesigns.forEach((design: CaseStyle) => {
                        if (design.color && design.color.trim() !== "" && !colorMap.has(design.color)) {
                            colorMap.set(design.color, {
                                thumbnail: design.thumbnail || '',
                                price: design.price
                            });
                        }
                    });

                    // Convert map to array and sort alphabetically
                    const colors = Array.from(colorMap.entries())
                        .map(([color, data]) => ({
                            color: capitalizeFirstLetter(color),
                            thumbnail: data.thumbnail,
                            price: data.price
                        }))
                        .sort((a, b) => a.color.localeCompare(b.color));

                    setAvailableColors(colors);

                    console.log('Colors available:', colors.length);
                    console.log('Material designs:', materialDesigns.length);
                    console.log('Material designs:', materialDesigns);

                    // If no colors available, auto-select the first available design and submit
                    if (colors.length === 0 && materialDesigns.length > 0) {
                        console.log('Auto-submitting design - no colors available');
                        const selectedDesign = materialDesigns[0];
                        console.log('Selected design:', selectedDesign);
                        if (selectedDesign && onSubmit) {
                            form.setFieldValue('color', selectedDesign.color || '');
                            
                            // Find the selected design (same logic as color click)
                            const finalDesign = materialDesigns.find(design => 
                                design.phoneModel?.toLowerCase() === selectedModel.toLowerCase() &&
                                design.material?.toLowerCase() === selectedMaterial.toLowerCase() &&
                                design.color?.toLowerCase() === selectedDesign.color?.toLowerCase()
                            );

                            console.log('Final design found:', finalDesign);

                            if (finalDesign && onSubmit) {
                                const queryParams = new URLSearchParams({
                                    phoneModel: finalDesign.phoneModel || '',
                                    material: finalDesign.material || '',
                                    color: finalDesign.color || '',
                                });
                                router.push(`/product-selection?${queryParams.toString()}`);
                                
                                onSubmit({
                                    id: finalDesign.id,
                                    phoneModel: finalDesign.phoneModel || '',
                                    phoneBrand: finalDesign.phoneBrand || '',
                                    thumbnail: finalDesign.thumbnail || '',
                                    color: finalDesign.color || '',
                                    material: finalDesign.material || '',
                                    seller: finalDesign.seller,
                                    type: finalDesign.type || 'Transparent',
                                    variation: finalDesign.variation || '',
                                    price: finalDesign.price,
                                    mockup: finalDesign.mockup
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching colors:', error);
                setError('Failed to load colors');
            }
        };

        getColorsForMaterial();
    }, [selectedModel, selectedBrand, selectedMaterial]);

    const form = useForm({
        initialValues: {
            phoneModel: "",
            material: "",
            color: "",
        },
        validate: {
            phoneModel: (value) => value ? null : "Please select a phone model",
            material: (value) => value ? null : "Please select a material",
            color: (value) => value ? null : "Please select a color"
        }
    });

    const handleSubmit = (values: typeof form.values) => {
        if (onSubmit) {
            const queryParams = new URLSearchParams({
                phoneModel: values.phoneModel,
                material: values.material,
                color: values.color,
            });
            router.push(`/product-selection?${queryParams.toString()}`);
            
            // Find the selected design to get all properties
            const selectedDesign = designs?.find(design => 
                design.phoneModel?.toLowerCase() === values.phoneModel.toLowerCase() &&
                design.material?.toLowerCase() === values.material.toLowerCase() &&
                design.color?.toLowerCase() === values.color.toLowerCase()
            );

            if (selectedDesign) {
                onSubmit({
                    id: selectedDesign.id,
                    phoneModel: selectedDesign.phoneModel || '',
                    phoneBrand: selectedDesign.phoneBrand || '',
                    thumbnail: selectedDesign.thumbnail || '',
                    color: selectedDesign.color || '',
                    material: selectedDesign.material || '',
                    seller: selectedDesign.seller,
                    type: selectedDesign.type || 'Transparent',
                    variation: selectedDesign.variation || '',
                    price: selectedDesign.price,
                    mockup: selectedDesign.mockup
                });
            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-start bg-white px-5">
            {error && (
                <div className="text-red-500 mt-4">{error}</div>
            )}

            {loading ? (
                <div className="mt-4">Loading...</div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full max-w-[1200px] px-4">
                    {!selectedBrand && (
                        <>
                            <p className="mt-20 font-Poppins font-bold text-[30px] text-black text-center">Select Your Phone Brand</p>
                            <div className="w-full flex justify-center mt-14">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
                                    {brands.map((brand, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => setSelectedBrand(brand.originalName)}
                                            className={`cursor-pointer flex items-center justify-center ${selectedBrand === brand.originalName ? 'ring-2 ring-[#A594F6]' : ''}`}
                                        >
                                                                        <div className="rounded-lg overflow-hidden">
                                        <Image
                                            src={`/assets/images/${brand.originalName}.png`}
                                            alt={brand.displayName}
                                            w={150}
                                            h={150}
                                            fit="contain"
                                        />
                                    </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {selectedBrand && !selectedModel && availableModels.length > 0 && (
                        <div className="flex flex-col items-center w-full mt-20">
                            <div className="w-full flex justify-center items-center">
                                <p className="font-Poppins font-bold text-[30px] text-center mb-8 md:mb-8 text-black">Select a Phone Model</p>
                            </div>
                            <div className="w-full flex justify-center">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
                                    {availableModels.map((model, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => {
                                                if (model.phoneModel) {
                                                    setSelectedModel(model.phoneModel);
                                                    form.setFieldValue('phoneModel', model.phoneModel);
                                                }
                                            }}
                                            className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-start"
                                        >
                                            <p className="text-start font-Poppins text-lg">{model.phoneModel}</p>
                                            
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedModel && !selectedMaterial && availableMaterials.length > 0 && (
                        <div className="flex flex-col items-center w-full mt-20">
                            <div className="w-full flex justify-center">
                                <p className="font-Poppins font-bold text-[30px] text-center mb-8 md:mb-8 text-black">Select a Material</p>
                            </div>
                            <div className="w-full flex justify-center">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
                                    {availableMaterials.map((material, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => {
                                                setSelectedMaterial(material.material);
                                                form.setFieldValue('material', material.material);
                                            }}
                                            className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-start"
                                        >
                                            <div className="rounded-3xl overflow-hidden">
                                                <Image
                                                    src={material.thumbnail}
                                                    alt={material.material}
                                                    w={200}
                                                    h={200}
                                                    fit="contain"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-4 w-full">
                                                <p className="text-start font-Poppins text-lg">{material.material}</p>
                                                <Tooltip
                                                    label={getMaterialTooltip(material.material)}
                                                    multiline
                                                    withArrow
                                                    position="bottom"
                                                    offset={5}
                                                    openDelay={0}
                                                    closeDelay={0}
                                                    styles={{
                                                        tooltip: {
                                                            backgroundColor: 'white',
                                                            color: 'black',
                                                            border: '1px solid #e5e7eb',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                            maxWidth: '300px'
                                                        }
                                                    }}
                                                >
                                                    <div className="cursor-pointer">
                                                        <div className="w-5 h-5 border-2 border-black rounded-full flex items-center justify-center hover:border-gray-700 transition-colors">
                                                            <span className="text-black text-xs font-bold">?</span>
                                                        </div>
                                                    </div>
                                                </Tooltip>
                                            </div>
                                            <p className="text-start font-Poppins text-lg font-bold text-[#A594F6]">
                                                {material.minPrice === material.maxPrice 
                                                    ? formatPrice(material.minPrice)
                                                    : `${formatPrice(material.minPrice)} - ${formatPrice(material.maxPrice)}`
                                                }
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedMaterial && availableColors.length > 0 && (
                        <div className="flex flex-col items-center w-full mt-20">
                            <div className="w-full flex justify-center">
                                <p className="font-Poppins font-bold text-[30px] text-center text-black mb-8">Select a Color</p>
                            </div>
                            <div className="w-full flex justify-center">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
                                    {availableColors.map((color, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => {
                                                form.setFieldValue('color', color.color);
                                                // Find the selected design
                                                const selectedDesign = designs?.find(design => 
                                                    design.phoneModel?.toLowerCase() === selectedModel.toLowerCase() &&
                                                    design.material?.toLowerCase() === selectedMaterial.toLowerCase() &&
                                                    design.color?.toLowerCase() === color.color.toLowerCase()
                                                );

                                                if (selectedDesign && onSubmit) {
                                                    const queryParams = new URLSearchParams({
                                                        phoneModel: selectedDesign.phoneModel || '',
                                                        material: selectedDesign.material || '',
                                                        color: selectedDesign.color || '',
                                                    });
                                                    router.push(`/product-selection?${queryParams.toString()}`);
                                                    
                                                    onSubmit({
                                                        id: selectedDesign.id,
                                                        phoneModel: selectedDesign.phoneModel || '',
                                                        phoneBrand: selectedDesign.phoneBrand || '',
                                                        thumbnail: selectedDesign.thumbnail || '',
                                                        color: selectedDesign.color || '',
                                                        material: selectedDesign.material || '',
                                                        seller: selectedDesign.seller,
                                                        type: selectedDesign.type || 'Transparent',
                                                        variation: selectedDesign.variation || '',
                                                        price: selectedDesign.price,
                                                        mockup: selectedDesign.mockup
                                                    });
                                                }
                                            }}
                                            className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-start"
                                        >
                                            <div className="rounded-3xl overflow-hidden">
                                                <Image
                                                    src={color.thumbnail}
                                                    alt={color.color}
                                                    w={200}
                                                    h={200}
                                                    fit="contain"
                                                />
                                            </div>
                                            <p className="text-start font-Poppins text-lg mt-4">{color.color}</p>
                                            <p className="text-start font-Poppins text-lg font-bold text-[#A594F6]">
                                                {formatPrice(color.price)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {selectedBrand && (
                <button
                    onClick={() => {
                        if (selectedMaterial) {
                            setSelectedMaterial('');
                        } else if (selectedModel) {
                            setSelectedModel('');
                        } else {
                            setSelectedBrand('');
                        }
                    }}
                    className="fixed bottom-8 right-8 z-50 px-6 py-3 rounded-full bg-purple text-white text-lg font-bold shadow-lg hover:bg-gray-800 transition-all"
                >
                    {selectedMaterial ? '← Back to Materials' : selectedModel ? '← Back to Models' : '← Back to Brands'}
                </button>
            )}
        </div>
    );
}