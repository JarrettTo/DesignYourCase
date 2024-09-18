'use client'

import Image from "next/image";
import { Button } from '@mantine/core';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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


export default function ProductSelection() {
    const searchParams = useSearchParams();
    const productId = searchParams.get('productId');

    const [products, setProducts] = useState<Product[]>([]);
    const [currentProduct, setCurrentProduct] = useState<Product>();
    const [models, setModels] = useState<Brand[]>([]);
    const [variations, setVariations] = useState<String[]>([]);

    const [selectedItem, setSelectedItem] = useState<Model | null>(null);
    const [selectedVar, setSelectedVar] = useState<string>('');

    const handleSelect = (item: Model) => {
        setSelectedItem(item);
    };

    const handleSelectVar = (item: any) => {
        setSelectedVar(item);
    };

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

    useEffect(() => {
        const foundProduct = products.find(product => product.productId.toString() === productId);
        setCurrentProduct(foundProduct);
    }, [products]);

    useEffect(() => {
        const allVariations = products.flatMap(product =>
            product.brands.flatMap(brand =>
              brand.models.flatMap(model =>
                model.variations
              )
            )
          );
        
          const uniqueVariations = Array.from(new Set(allVariations.map(variation => variation.trim())));
          
          console.log(uniqueVariations);
          setVariations(uniqueVariations);
    }, [products])

    useEffect(() => {
        if(!selectedItem?.variations.includes(selectedVar)) {
            setSelectedItem(null)
        }
    }, [selectedVar])

    return(
    <div className="w-full h-full flex flex-col items-center justify-start">
        <div className="h-screen w-full bg-white flex flex-col items-center justify-start">
            <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Choose your case</p>

            <div className="py-10 px-10 w-54 flex flex-col justify-end items-center">
                {variations.map((variation, index) => (
                    <Button 
                        className="w-full my-5" 
                        variant="filled" 
                        color="#A594F6" 
                        radius="xl" 
                        fullWidth size="md"
                        key={index}
                        styles={{
                            root: {
                                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                            }
                        }}
                        style={{border: selectedVar === variation ? 'transparent' : 'solid 1px black' , 
                            backgroundColor: selectedVar === variation ? '#A594F6' : 'white',
                            color: selectedVar === variation ? 'white' : 'black' }}
                        onClick={() => handleSelectVar(variation)}
                    >
                        <p className="drop-shadow-md text-[23px] font-Poppins font-black">{variation}</p>
                    </Button>
                ))}
            </div>
        </div>

        <div className="min-h-screen w-full bg-[#E9E0FF] flex flex-col items-center justify-start">
            <p className="mt-20 font-Loubag text-[30px] text-black">Choose your phone model</p>
            <div className="h-auto mt-24 flex flex-row items-start justify-center w-auto">             
                {currentProduct?.brands.map((brand, index) => (
                    <div key={index} className="h-full flex flex-col items-start justify-center mx-8">
                        <p className="text-xl font-Poppins font-bold my-3 px-3 text-center w-full bg-white rounded-xl">{brand.name}</p>
                        {brand.models.map((phone, phoneIndex) => (
                            <Button onClick={() => handleSelect(phone)} 
                            key={phoneIndex}
                            size="compact-sm" 
                            className="font-Poppins font-200 my-1"
                            disabled={!phone.variations.includes(selectedVar)}
                            style={{backgroundColor: selectedItem === phone ? '#A594F6' : 'transparent', 
                                    color: !phone.variations.includes(selectedVar) ? 'gray' : selectedItem === phone ? 'white' : 'black' }}>
                                {phone.modelName}
                            </Button>
                        ))}
                    </div>
                ))}
            </div>
            <Button className="my-5" variant="gradient" size='xl' radius='xl' gradient={{from: '#FFC3FE', to: '#B5F5FC', deg: 90}}  
                styles={{
                    root: {
                        filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                    }
                }}
            >
                <p className="drop-shadow-md text-[28px] font-Poppins font-black">Design Your Case</p>
            </Button>
        </div>
    </div>
    )
}