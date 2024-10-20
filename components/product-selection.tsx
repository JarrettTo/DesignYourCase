'use client'

import { Button, Radio, Combobox, InputBase, useCombobox, Input, ColorPicker } from '@mantine/core';
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
    const [varChecked, setVarChecked] = useState(false);

    const [value, setValue] = useState<string | null>(null);

    const [color, setColor] = useState('#ffa1efff');

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
        const allVariations: CaseType[] = ['Transparent', 'Colored']; // Hardcoded variations
        setVariations(allVariations);
    }, []);


    useEffect(() => {
        if (!selectedItem?.variations.includes(selectedVar)) {
            setSelectedItem(null)
        }
    }, [selectedVar])

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <div className="w-full h-full flex flex-col items-center justify-start">
                <div className="w-full bg-white flex flex-row items-start justify-center">
                    <div className="flex flex-col w-full items-center justify-start mx-16">
                        <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Choose your case</p>

                        <div className="mt-20 px-10 w-54 flex flex-col justify-end items-center">
                            <Radio.Group
                                {...form.getInputProps('variation')}
                                value={selectedVar}
                                onChange={(value) => {
                                    const caseTypeValue = value as CaseType;
                                    setSelectedVar(caseTypeValue);
                                    form.setFieldValue('variation', caseTypeValue);
                                }}
                            >
                                {variations.map((variation, index) => (
                                    <Radio
                                        checked={varChecked}
                                        label={variation}
                                        className="font-Poppins font-bold mb-6"
                                        value={variation}  // Ensure value is CaseType
                                        key={index}
                                    />
                                ))}
                            </Radio.Group>


                            {selectedVar === "Colored" && (
                                <ColorPicker
                                    format="hexa"
                                    value={color}
                                    onChange={(value) => {
                                        setColor(value);
                                        form.setFieldValue('color', value);
                                    }}
                                // {...form.getInputProps('color')}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col w-full items-center justify-start mx-16">
                        <p className="mt-20 font-Loubag text-[30px] text-align text-black">Choose your phone model</p>
                        <div className="mt-20 flex flex-col items-center justify-start w-auto">
                            <Combobox
                                store={combobox}
                                withinPortal={false}
                                onOptionSubmit={(val) => {
                                    setValue(val);
                                    combobox.closeDropdown();
                                }}
                            >
                                <Combobox.Target>
                                    <InputBase
                                        component="button"
                                        type="button"
                                        pointer
                                        rightSection={<Combobox.Chevron />}
                                        onClick={() => combobox.toggleDropdown()}
                                        rightSectionPointerEvents="none"
                                    >
                                        {value || <Input.Placeholder>Pick value</Input.Placeholder>}
                                    </InputBase>
                                </Combobox.Target>

                                <Combobox.Dropdown>
                                    {currentProduct?.brands.map((brand, index) => (
                                        <Combobox.Options key={index}>
                                            <Combobox.Option value={brand.name}>
                                                {brand.name}
                                            </Combobox.Option>
                                        </Combobox.Options>
                                    ))}
                                </Combobox.Dropdown>
                            </Combobox>

                            {currentProduct?.brands.map((brand, index) => (
                                value === brand.name && (
                                    <div className="flex flex-col justify-center items-start" key={index}>
                                        {brand.models.map((phone, phoneIndex) => (
                                            <Button
                                                onClick={() => {
                                                    handleSelect(phone);
                                                    form.setFieldValue('phoneModel', phone.modelName);
                                                }}
                                                key={phoneIndex}
                                                size="compact-sm"
                                                className="font-Poppins font-200 my-1"
                                                disabled={!phone.variations.includes(selectedVar)}
                                                style={{
                                                    backgroundColor: selectedItem === phone ? '#A594F6' : 'transparent',
                                                    color: !phone.variations.includes(selectedVar) ? 'gray' : selectedItem === phone ? 'white' : 'black'
                                                }}
                                            >
                                                {phone.modelName}
                                            </Button>
                                        ))}
                                    </div>
                                )
                            ))}

                        </div>
                    </div>
                </div>
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
    )
}