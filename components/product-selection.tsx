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
    phoneModel: string;
    variation: string;
    secondVar: string;
}

// Add interface for component props
interface ProductSelectionProps {
    onSubmit?: (options: SelectedOptions) => void;
}

const phoneBrands = [
    "iPhone",
    "Huawei",
    "Vivo",
    "OPPO",
    "Xiaomi",
    "OnePlus",
    "Redmi",
    "Honor",
    "iQOO"
]

const variations = [
    "Transparent",
    "Cream",
    "Laser Engraving",
    "Silicone",
    "Mirror",
    "Tempered Glass",
    "Lambskin",
    "Wheat"
]

const varImages = [
    "1.5 mm thickened transparent.png",
    "cream case.jpg",
    "imd laser.jpg",
    "straight edge liquid silicone.png",
    "mirror case.jpg",
    "metallic paint tempered glass.png",
    "soft lambskin.jpg",
    "wheat case.png"
]

const brands = [
    "iPhone",
    "Huawei",
    "IQOO",
    "Vivo",
    "Oppo",
    "Xiaomi",
    "Redmi",
    "OnePlus",
    "Honor",
    "Meizu"
]

const brandImages = [
    "iphone.png",
    "huawei.png",
    "iqoo.png",
    "vivo.png",
    "oppo.png",
    "xiaomi.png",
    "redmi.png",
    "oneplus.png",
    "honor.png",
    "meizu.jpg"
]

const iPhoneModels = [
    "iPhone12",
    "iPhone12Pro",
    "iPhone12ProMax",
    "iPhone13",
    "iPhone13Pro",
    "iPhone13ProMax",
    "iPhone14",
    "iPhone14Pro",
    "iPhone14ProMax",
]

const iPhoneModelsImages = [
    "iphone-12/Iphone 12.svg",
    "iphone-12/Iphone 12 pro.svg",
    "iphone-12/Iphone 12 pro max.svg",
    "iphone-13/iPhone 13.svg",
    "iphone-13/iPhone 13 pro.svg",
    "iphone-13/iPhone 13 pro max.svg",
    "iphone-14/iPhone 14.svg",
    "iphone-14/iPhone 14 pro.svg",
    "iphone-14/iPhone 14 pro max.svg",
]


export default function ProductSelection({ onSubmit }: ProductSelectionProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get('productId');

    const [products, setProducts] = useState<Product[]>([]);
    const [currentProduct, setCurrentProduct] = useState<Product>();
    const [selectedBrand, setSelectedBrand] = useState('');

    const [selectedItem, setSelectedItem] = useState<Model | null>(null);
    const [selectedVar, setSelectedVar] = useState<string>('');
    const [secondLength, setSecondLength] = useState<number>(0);
    const [secondOptions, setSecondOptions] = useState<string[]>([]);
    const [selectedSecond, setSelectedSecond] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [secondOptionImage, setSecondOptionImage] = useState<string[]>([]);
    const [unavailable, setUnavailable] = useState<string[]>([]);

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
            phoneModel: "",
            secondVar: "",
        },
        validate: {
            variation: (value) => value ? null : "Please select a variation",
            phoneModel: (value) => value ? null : "Please select a phone model"
        }
    });
    // Update form values when selections change
    useEffect(() => {
        if (selectedVar) {
            form.setFieldValue('variation', selectedVar);
        }
    }, [selectedVar]);

    useEffect(() => {
        if (selectedBrand) {
            form.setFieldValue('phoneModel', selectedBrand);
        }
    }, [selectedBrand]);

    useEffect(() => {
        if (selectedVar) {
            form.setFieldValue('variation', selectedVar);
        }
    }, [selectedVar]);

    useEffect(() => {
        if (selectedSecond) {
            form.setFieldValue('secondVar', selectedSecond);
        }
    }, [selectedSecond]);

    useEffect(() => {
        if (color) {
            form.setFieldValue('color', color);
        }
    }, [color]);

    const handleSubmit = (values: typeof form.values) => {

        if (!values.variation || !values.phoneModel) {
            console.error('Missing required fields');
            return;
        }

        const selectedOptions: SelectedOptions = {
            phoneModel: values.phoneModel,
            variation: values.variation,
            secondVar: values.secondVar
        };

        if (onSubmit) {
            onSubmit(selectedOptions);
        }

        const queryParams = new URLSearchParams({
            phoneModel: values.phoneModel,
            caseType: values.variation,
            caseSecondType: values.secondVar
        });

        router.push(`/phone-case-editor?${queryParams.toString()}`);
        console.log("submitted", selectedOptions);
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
        const toggleOptions = () => {
            if (selectedVar === "Silicone") {
                const tempArray = ["Matte", "Hawkeye", "Liquid Silicone"];
                const imageArray = [
                    "matte edge silicone.png",
                    "hawkeye matte silicone.png",
                    "straight edge liquid silicone.png"
                ];
                setSecondOptionImage(imageArray);
                setSecondOptions(tempArray);
                setSecondLength(3);
            }
            else if (selectedVar === "Full Wrap") {
                const tempArray = ["Hard Case", "Soft Case"]
                setSecondOptionImage([]);
                setSecondOptions(tempArray);
                setSecondLength(2);
            }
            else if (selectedVar === "Transparent") {
                const tempArray = ["Soft", "Airbag", "1.5 mm Thickened", "Space"];
                const imageArray = [
                    "soft transparent.png",
                    "airbag transparent.jpg",
                    "1.5 mm thickened transparent.png",
                    "space transparent.png"
                ];
                setSecondOptionImage(imageArray);
                setSecondOptions(tempArray);
                setSecondLength(4);
            }
            else if (selectedVar === "Transparent with Edges") {
                const tempArray = ["Matte"];
                const imageArray = [
                    "matte edge.png"
                ];
                setSecondOptionImage(imageArray);
                setSecondOptions(tempArray);
                setSecondLength(1);
            }
            else if (selectedVar === "Laser Engraving") {
                const tempArray = ["IMD Laser", "Laser Engraving"];
                const imageArray = [
                    "imd laser.jpg",
                    "laser engraving case.png"
                ];
                setSecondOptionImage(imageArray);
                setSecondOptions(tempArray);
                setSecondLength(2);
            }
            else if (selectedVar === "Tempered Glass") {
                const tempArray = ["Metallic paint", "Regular"];
                const imageArray = [
                    "metallic paint tempered glass.png",
                    "tempered glass.jpg"
                ];
                setSecondOptionImage(imageArray);
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


    useEffect(() => {
        if (selectedVar === "Mirror" || selectedVar === "Wheat" || selectedVar === "Cream" || selectedSecond === "Laser Engraving") {
            setUnavailable([
                "Huawei",
                "IQOO",
                "Vivo",
                "Oppo",
                "Xiaomi",
                "Redmi",
                "OnePlus",
                "Honor",
                "Meizu"
            ])
        }
        else {
            setUnavailable([]);
        }
    }, [selectedSecond, selectedVar])

    return (
        <>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="w-full h-full flex flex-col items-center justify-start">
                    <p className="my-20 font-Loubag text-[30px] text-[#A594F6]">Choose your case</p>

                    <SimpleGrid cols={5}>
                        {variations?.map((variation, index) => (
                            <div className='flex flex-col items-center justify-center'>
                                <Image
                                    src={varImages.length ? `/assets/phone cases/${varImages[index]}` : "/assets/images/transparent-case.png"}
                                    h={200}
                                    w="auto"
                                />
                                <Button onClick={(e) => setSelectedVar(variation)} className="my-10" variant="filled" size='l' radius='xl' color={selectedVar === variation ? "#7359b5" : "#A594F6"}>
                                    <p className=" font-Loubag text-[15px] text-white">{variation}</p>
                                </Button>
                            </div>
                        ))}
                    </SimpleGrid>

                    {secondLength > 0 &&
                        <>
                            <p className="my-20 font-Loubag text-[30px] text-[#A594F6]">Select a variation</p>
                            <SimpleGrid cols={secondLength}>
                                {secondOptions?.map((option, index) => (
                                    <div className='mx-6 flex flex-col items-center justify-center' key={index}>
                                        <Image
                                            src={secondOptionImage.length ? `/assets/phone cases/${secondOptionImage[index]}` : "/assets/images/transparent-case.png"}
                                            h={200}
                                            w="auto"
                                        />
                                        <Button onClick={(e) => setSelectedSecond(option)} className="my-10" variant="filled" radius='xl' color={selectedSecond === option ? "#7359b5" : "#A594F6"}>
                                            <p className=" font-Loubag text-[15px] text-white">{option}</p>
                                        </Button>
                                    </div>
                                ))}
                            </SimpleGrid>
                        </>
                    }

                    <p className="my-20 font-Loubag text-[30px] text-[#A594F6]">Select a Phone Brand and Model</p>
                    <SimpleGrid cols={5}>
                        {phoneBrands.map((brand, index) => (
                            <div key={index} className='flex flex-col items-center justify-end h-60 mx-9'>
                                <Image
                                    src={`/assets/images/${brandImages[index]}`}
                                    w={100}
                                    fit="contain"
                                    h={100}
                                />
                                <Button disabled={unavailable.includes(brand)} onClick={(e) => setSelectedBrand(brand)} className="my-10" variant="filled" size='l' radius='xl' color={selectedBrand === brand ? "#7359b5" : "#A594F6"}>
                                    <p className=" font-Loubag text-[15px] text-white">{brand}</p>
                                </Button>
                            </div>
                        ))}
                    </SimpleGrid>

                    {selectedBrand == "iPhone" &&

                        <SimpleGrid cols={5}>
                            {iPhoneModels.map((model, index) => (
                                <div key={index} className='flex flex-col items-center justify-end h-60 mx-9'>
                                    <Image
                                        src={`/assets/frames/${iPhoneModelsImages[index]}`}
                                        w={100}
                                        fit="contain"
                                        h={100}
                                    />
                                    <Button onClick={(e) => setSelectedModel(model)} className="my-10" variant="filled" size='l' radius='xl' color={selectedModel === model ? "#7359b5" : "#A594F6"}>
                                        <p className=" font-Loubag text-[15px] text-white">{model}</p>
                                    </Button>
                                </div>
                            ))}
                        </SimpleGrid>

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