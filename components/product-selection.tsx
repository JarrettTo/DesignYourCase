'use client'

import { Button, Radio, Combobox, InputBase, useCombobox, Input, ColorPicker, SimpleGrid, Image, Popover } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type CaseType = 'Transparent' | 'Colored';

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

// Add interface for selected options
interface SelectedOptions {
    type: CaseType;
    color: string;
    phoneModel: string;
}

// Add interface for component props
interface ProductSelectionProps {
    onSubmit?: (options: SelectedOptions) => void;
}

export default function ProductSelection({ onSubmit }: ProductSelectionProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get('productId');

    const [products, setProducts] = useState<Product[]>([]);
    const [currentProduct, setCurrentProduct] = useState<Product>();
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [variations, setVariations] = useState<CaseType[]>([]);

    const [selectedItem, setSelectedItem] = useState<Model | null>(null);
    const [selectedVar, setSelectedVar] = useState<string>('');
    const [secondLength, setSecondLength] = useState<number>(0);
    const [secondOptions, setSecondOptions] = useState<string[]>([]);
    const [varChecked, setVarChecked] = useState(false);

    const [value, setValue] = useState<string | null>(null);

    const [color, setColor] = useState('#ffa1efff');

    const [openedWrap, setOpenedWrap] = useState(false);

    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const handleSelect = (item: Model) => {
        setSelectedItem(item);
    };

    const form = useForm({
        initialValues: {
            variation: "",
            color: "",
            phoneModel: ""
        },
        validate: {
            variation: (value) => value ? null : "Please select a variation",
            color: (value) => selectedVar === "Colored" ? (value ? null : "Please select a color") : null,
            phoneModel: (value) => value ? null : "Please select a phone model"
        }
    });

    const handleSubmit = (values: typeof form.values) => {
        const selectedOptions: SelectedOptions = {
            type: values.variation as CaseType,
            color: values.color,
            phoneModel: values.phoneModel
        };

        if (onSubmit) {
            onSubmit(selectedOptions);
        }

        const queryParams = new URLSearchParams({
            type: values.variation,
            color: encodeURIComponent(values.color),
            phoneModel: encodeURIComponent(values.phoneModel)
        });

        router.push(`/phone-case-editor?${queryParams.toString()}`);
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
        const allVariations: CaseType[] = ['Transparent', 'Colored'];
        setVariations(allVariations);
    }, []);


    useEffect(() => {
        if (!selectedItem?.variations.includes(selectedVar)) {
            setSelectedItem(null)
        }
    }, [selectedVar])

    useEffect(() => {
        const toggleOptions = () => {
            if (selectedVar === "Silicone") {
                const tempArray = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"];
                setSecondOptions(tempArray);
                setSecondLength(3);
            }
            else if (selectedVar === "Full Wrap") {
                const tempArray = ["Hard Case", "Soft Case"]
                setSecondOptions(tempArray);
                setSecondLength(2);
            }
            else {
                setSecondOptions([]);
                setSecondLength(0);
            }
        }
        toggleOptions();
    }, [selectedVar]);

    return (
        <>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="w-full h-full flex flex-col items-center justify-start">
                    <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Choose your case</p>

                    <SimpleGrid cols={5}>
                        <div className='flex flex-col items-center justify-center'>
                            <Image
                                src="/assets/images/transparent-case.png"
                                h={200}
                                w="auto"
                            />
                            <Button onClick={(e) => setSelectedVar("Transparent")} className="my-10" variant="filled" size='l' radius='xl' color="#A594F6">
                                <p className=" font-Loubag text-[15px] text-white">Transparent</p>
                            </Button>
                        </div>
                        <div className='flex flex-col items-center justify-center'>
                            <Image
                                src="/assets/images/transparent-case.png"
                                h={200}
                                w="auto"
                            />
                            <Button onClick={(e) => setSelectedVar("Transparent with Edges")} className="my-10" variant="filled" size='l' radius='xl' color="#A594F6">
                                <p className=" font-Loubag text-[15px] text-white">Transparent with Edeges</p>
                            </Button>
                        </div>
                        <div className='flex flex-col items-center justify-center'>
                            <Image
                                src="/assets/images/transparent-case.png"
                                h={200}
                                w="auto"
                            />
                            <Button onClick={(e) => setSelectedVar("Silicone")} className="my-10" variant="filled" size='l' radius='xl' color="#A594F6">
                                <p className=" font-Loubag text-[15px] text-white">Silicone</p>
                            </Button>
                        </div>
                        <div className='flex flex-col items-center justify-center'>
                            <Image
                                src="/assets/images/transparent-case.png"
                                h={200}
                                w="auto"
                            />
                            <Button onClick={(e) => setSelectedVar("Mirror Back")} className="my-10" variant="filled" size='l' radius='xl' color="#A594F6">
                                <p className=" font-Loubag text-[15px] text-white">Mirror Back</p>
                            </Button>
                        </div>
                        <div className='flex flex-col items-center justify-center'>
                            <Image
                                src="/assets/images/transparent-case.png"
                                h={200}
                                w="auto"
                            />
                            <Button onClick={(e) => setSelectedVar("Full Wrap")} className="my-10" variant="filled" size='l' radius='xl' color="#A594F6">
                                <p className=" font-Loubag text-[15px] text-white">Full Wrap</p>
                            </Button>
                        </div>
                    </SimpleGrid>

                    {secondLength > 0 &&
                        <>
                            <p className="mb-20 font-Loubag text-[30px] text-[#A594F6]">Select a variation</p>
                            <SimpleGrid cols={secondLength}>
                                {secondOptions?.map((option, index) => (
                                    <div className='mx-6 flex flex-col items-center justify-center' key={index}>
                                        <Image
                                            src="/assets/images/transparent-case.png"
                                            h={200}
                                            w="auto"
                                        />
                                        <Button onClick={(e) => setSelectedVar(option)} className="my-10" variant="filled" radius='xl' color="#A594F6">
                                            <p className=" font-Loubag text-[15px] text-white">{option}</p>
                                        </Button>
                                    </div>
                                ))}
                            </SimpleGrid>
                        </>
                    }

                    <Button type="submit" className="my-10" variant="gradient" size='xl' radius='xl' gradient={{ from: '#FFC3FE', to: '#B5F5FC', deg: 90 }}
                        styles={{
                            root: {
                                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                            }
                        }}
                    >
                        <p className="drop-shadow-md text-[28px] font-Poppins font-black">Design Your Case</p>
                    </Button>
                </div>
            </form>
        </>
    )
}