'use client'

import { MantineProvider } from "@mantine/core";
import { useEffect, useState } from 'react';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Tabs } from '@mantine/core';
import Image from 'next/image';

interface Design {
    id: string;
    user_id: string;
    case_style: {
        phone_model: string;
        phone_brand: string;
        material: string;
        color: string;
        price: number;
        mockup: string;
    };
    thumbnail_url?: string;
    image_urls: string[];
}

export default function ProductList() {
    const { session } = useSessionContext();
    const user = session?.user;
    const supabase = createClientComponentClient();
    const [designs, setDesigns] = useState<Design[]>([]);


    useEffect(() => {
        if (user?.email) {
            getUserCases(user.email);
        }
    }, [user]);

    async function getUserCases(email: string) {
        let designIds: string[] = [];
        try {
            const { data: ids, error: designsError } = await supabase
                .from('designs')
                .select('id')
                .eq('user_id', email);

            if (designsError) {
                console.error('Error fetching designs for user ID:', email, designsError);
            }

            if (ids) {
                designIds = ids.map(item => item.id as string);
            }
        } catch (error) {
            console.error('Error in getUserCases:', error);
        }

        fetchDesigns(designIds);
        console.log(designs);
    }

    async function fetchDesigns(ids: string[]) {
        try {
            // Fetch designs with case style details using the database function
            const { data: designsData, error: designsError } = await supabase
                .rpc('get_designs_with_details', {
                    design_ids: ids
                });

            if (designsError) {
                console.error('Error fetching designs:', designsError);
                throw designsError;
            }

            if (!designsData || designsData.length === 0) {
                console.error('No designs found');
                return;
            }

            // Fetch thumbnails for each design
            const designsWithThumbnails = await Promise.all(
                designsData.map(async (design: any) => {
                    try {
                        // Get the stage thumbnail URL
                        const { data: { publicUrl: stageUrl } } = supabase.storage
                            .from('phone-case-designs')
                            .getPublicUrl(`design-images/${design.user_id}/${design.id}/stage.png`);

                        // Get all image URLs for this design
                        const { data: imageFiles, error: imageError } = await supabase.storage
                            .from('phone-case-designs')
                            .list(`design-images/${design.user_id}/${design.id}`);

                        if (imageError) {
                            console.error('Error fetching design images:', imageError);
                            throw imageError;
                        }

                        // Get public URLs for all images
                        const imageUrls = await Promise.all(
                            (imageFiles || []).map(async (file) => {
                                const { data: { publicUrl } } = supabase.storage
                                    .from('phone-case-designs')
                                    .getPublicUrl(`design-images/${design.user_id}/${design.id}/${file.name}`);
                                return publicUrl;
                            })
                        );

                        const designData: Design = {
                            id: design.id,
                            user_id: design.user_id,
                            case_style: {
                                phone_model: design.phone_model,
                                phone_brand: design.phone_brand,
                                material: design.material,
                                color: design.color,
                                price: design.price,
                                mockup: design.mockup
                            },
                            thumbnail_url: stageUrl,
                            image_urls: imageUrls
                        };

                        return designData;
                    } catch (error) {
                        console.error(`Error processing design ${design.id}:`, error);
                        const fallbackDesign: Design = {
                            id: design.id,
                            user_id: design.user_id,
                            case_style: {
                                phone_model: design.phone_model,
                                phone_brand: design.phone_brand,
                                material: design.material,
                                color: design.color,
                                price: design.price,
                                mockup: design.mockup
                            },
                            thumbnail_url: design.mockup,
                            image_urls: []
                        };
                        return fallbackDesign;
                    }
                })
            );

            setDesigns(designsWithThumbnails);
        } catch (error) {
            console.error('Error in fetchDesigns:', error);
        }
    }


    return (
        <MantineProvider>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-8">User Dashboard</h1>

                {designs.map((design) => (
                    <div key={design.id} className="flex gap-4 p-4 border rounded-lg my-5 mr-10">
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <Image
                                src={design.thumbnail_url || design.case_style.mockup}
                                alt={design.case_style.phone_model}
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-medium text-lg">
                                {design.case_style.material.charAt(0).toUpperCase() + design.case_style.material.slice(1)} Case
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1 mt-1">
                                <p>Phone: {design.case_style.phone_brand.charAt(0).toUpperCase() + design.case_style.phone_brand.slice(1)} {design.case_style.phone_model.charAt(0).toUpperCase() + design.case_style.phone_model.slice(1)}</p>
                                <p>Color: {design.case_style.color.charAt(0).toUpperCase() + design.case_style.color.slice(1)}</p>
                                <p className="font-semibold text-base mt-2">${design.case_style.price}</p>
                            </div>
                        </div>
                        <div>
                            <div className="p-2 bg-orange-300 rounded-md">
                                <p className="text-sm font-semibold">Status</p>
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </MantineProvider>
    );
}