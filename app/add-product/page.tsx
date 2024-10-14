'use client'

import { useState } from 'react';
import '@mantine/core/styles.css';
import { Button, MantineProvider, TextInput, Textarea, Group } from "@mantine/core";
import { useForm } from '@mantine/form';

export default function AddProduct() {
    const [brands, setBrands] = useState([{ name: "", models: [{ modelName: "", variations: "" }] }]);

    const form = useForm({
        initialValues: { product: "" },
    });

    // Function to handle adding more brand inputs
    const addBrand = () => {
        setBrands([...brands, { name: "", models: [{ modelName: "", variations: "" }] }]);
    };

    // Function to handle adding more model inputs for a specific brand
    const addModel = (brandIndex: number) => {
        const updatedBrands = brands.map((brand, i) =>
            i === brandIndex ? { ...brand, models: [...brand.models, { modelName: "", variations: "" }] } : brand
        );
        setBrands(updatedBrands);
    };

    // Function to handle changes for brand, model, or variations
    const handleBrandChange = (index: number, key: string, value: string) => {
        const updatedBrands = brands.map((brand, i) =>
            i === index ? { ...brand, [key]: value } : brand
        );
        setBrands(updatedBrands);
    };

    const handleModelChange = (brandIndex: number, modelIndex: number, key: string, value: string) => {
        const updatedBrands = brands.map((brand, i) =>
            i === brandIndex
                ? {
                    ...brand,
                    models: brand.models.map((model, j) =>
                        j === modelIndex ? { ...model, [key]: value } : model
                    )
                }
                : brand
        );
        setBrands(updatedBrands);
    };

    // Submit the form and brands to the API
    const handleSubmit = async (values: { product: any; }) => {
        const data = {
            product: values.product,
            brands: brands.map((brand) => ({
                name: brand.name,
                models: brand.models.map((model) => ({
                    modelName: model.modelName,
                    variations: model.variations.split(",") // Split variations by comma
                }))
            }))
        };

        const response = await fetch('/api/save-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert("Product data saved successfully!");
        } else {
            alert("Failed to save product data.");
        }
    };

    return (
        <main className='flex flex-col m-20'>
            <MantineProvider>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <p>Product Name</p>
                    <TextInput
                        placeholder="Input product name"
                        className="w-56"
                        label="product"
                        {...form.getInputProps('product')}
                    />

                    {brands.map((brand, brandIndex) => (
                        <div key={brandIndex} className="mt-4">
                            <p>Brand Name {brandIndex + 1}</p>
                            <TextInput
                                placeholder="Input phone brand name"
                                className="w-56"
                                value={brand.name}
                                onChange={(event) =>
                                    handleBrandChange(brandIndex, 'name', event.target.value)
                                }
                            />

                            {brand.models.map((model, modelIndex) => (
                                <div key={modelIndex} className="mt-2">
                                    <p>Model Name {modelIndex + 1}</p>
                                    <TextInput
                                        placeholder="Input phone model name"
                                        className="w-56"
                                        value={model.modelName}
                                        onChange={(event) =>
                                            handleModelChange(brandIndex, modelIndex, 'modelName', event.target.value)
                                        }
                                    />

                                    <p>Model Variations</p>
                                    <Textarea
                                        placeholder="Input model variations like this: Colored,Transparent"
                                        className="w-56"
                                        value={model.variations}
                                        onChange={(event) =>
                                            handleModelChange(brandIndex, modelIndex, 'variations', event.target.value)
                                        }
                                        autosize
                                        minRows={2}
                                    />
                                </div>
                            ))}

                            <Button type="button" mt="sm" onClick={() => addModel(brandIndex)}>
                                Add another model
                            </Button>
                        </div>
                    ))}

                    <Group mt="md">
                        <Button type="button" onClick={addBrand}>Add another brand</Button>
                    </Group>

                    <Button type="submit" mt="sm">Submit</Button>
                </form>
            </MantineProvider>
        </main>
    );
}
