'use client'

import Image from "next/image";
import { Button } from '@mantine/core';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const phoneModels = [
    'iPhone', 'Huawei', 'Honor', 'OPPO', 'Vivo', 'OnePlus', 'Xiaomi'
];

export default function ProductSelection() {
    const searchParams = useSearchParams();
    const link = searchParams.get('link');

    const [models, setModels] = useState([]);
    const [categories, setCategories] = useState<[string, string[]][]>([]);

    useEffect(() => {
        const fetchModels = async() => {
            const checkResponse = await fetch('/api/product', {
                method: "POST",
                body: JSON.stringify({
                    test: link
                })
            });

            const result = await checkResponse.json();
            console.log(result);
            setModels(result.translatedArr);
        }

       fetchModels();
    }, []);

    useEffect(() => {
        
        const groupModels = () => {
            const newCategories: {[brand: string]: string[]} = {};
            models?.map((model: any) => {
                const [brandName, ...rest] = model.split(' ');
                const brandIndex = phoneModels.indexOf(brandName);
                const brand = phoneModels[brandIndex];
                console.log(brand);

                if (brand) {
                    if (!newCategories[brand]) {
                        newCategories[brand] = [];
                    }
                    newCategories[brand].push(model);
                }
            });

            var result = Object.entries(newCategories);
            console.log(result);

            var sorted: [string, string[]][] = [];

            for (let i = 0; i < result.length; i++) {
                sorted.push([result[i][0], result[i][1].sort()]);
            }

            setCategories(sorted);
        }

        groupModels();
        console.log(categories);
    }, [models]);


    return(
    <div className="w-full h-full flex flex-col items-center justify-start">
        <div className="h-screen w-full bg-white flex flex-col items-center justify-start">
            <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Choose your case</p>

            <div className="py-10 flex flex-row justify-end items-center">
                <div className="flex flex-col justify-center items-center mx-20 w-[200px]">
                    <Image 
                        src="/assets/images/transparent-case.png"
                        alt="transparent case"
                        width={170}
                        height={170}
                        className="mb-[30px]"
                    />
                    <Button variant="filled" color="#A594F6" radius="xl" fullWidth size="md"
                        styles={{
                            root: {
                                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                            }
                        }}
                    >
                        <p className="drop-shadow-md text-[23px] font-Poppins font-black">Transparent</p>
                    </Button>
                </div>
                <div className="flex flex-col justify-center items-center mx-20 w-[200px]">
                    <Image 
                        src="/assets/images/colored-case.png"
                        alt="colored case"
                        width={180}
                        height={180}
                        className="mb-[30px]"
                    />
                    <Button variant="filled" color="#A594F6" radius="xl" fullWidth size="md"
                        styles={{
                            root: {
                                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                            }
                        }}
                    >
                        <p className="drop-shadow-md text-[23px] font-Poppins font-black">Colored</p>
                    </Button>
                </div>
            </div>
        </div>

        <div className="min-h-screen w-full bg-[#E9E0FF] flex flex-col items-center justify-start">
            <p className="mt-20 font-Loubag text-[30px] text-black">Choose your phone model</p>
            <div className="h-auto mt-24 flex flex-row items-start justify-center w-auto">             
                {categories?.map((brand, index) => (
                    <div key={index} className="h-full flex flex-col items-start justify-start mx-10">
                        <p className="text-lg font-Poppins font-bold my-3">{brand[0]}</p>
                        {brand[1].map((phone, phoneIndex) => (
                            <p key={phoneIndex} className="text-md font-Poppins my-1">{phone}</p>
                        ))}
                    </div>
                ))}
            </div>
            <Button variant="gradient" size='xl' radius='xl' gradient={{from: '#FFC3FE', to: '#B5F5FC', deg: 90}}  
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