'use client'

import React, { useEffect, useState } from 'react';
import ItemCard from "./item-card";

type Variation = {
    variation: string;
}

type Model = {
    modelName: string;
    variations: string[];
}

type Brand = {
    name: string;
    models: Model[];
}

type Product = {
    productId: number;
    product: string;
    brands: Brand[];
}

export default function ProductListing() {
    const [products, setProducts] = useState<Product[]>([]);  // Initialize with an empty array

    useEffect(() => {
        const getProducts = async () => {
            try {
                const response = await fetch('/api/get-products', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log(result.currentData);
                setProducts(result.currentData);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        } 
        getProducts();
    }, []);

    return(
        <div className="w-full h-full flex flex-col items-center justify-start bg-white">
            <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Product Listings</p>
            <div className="w-[1200px] h-full flex flex-row flex-wrap items-start justify-center my-14">
                {products.map((item, index) => (
                    <ItemCard key={index} productName={item.product} productId={item.productId} index={index}/>
                ))}
            </div>
        </div>
   );
}