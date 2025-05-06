'use client'

import { SimpleGrid, Image, Box, Text, UnstyledButton, AspectRatio, Center, MantineStyleProp, Card, Group, ActionIcon, Popover, Button } from '@mantine/core';
import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconX } from '@tabler/icons-react';
import { Suspense } from "react";
// import Link from 'next/link'; // Link is not needed if using useRouter
import { useRouter } from 'next/navigation'; // <-- Import useRouter

interface ChooseFlowScreenProps { // Renamed for clarity
    onBrandSelect?: (brandName: string) => void;
    onModelSelect?: (modelName: string) => void;
    onMaterialSelect?: (materialName: string) => void; // Add callback for material
    onCaseStyleSelect?: (styleName: string) => void;
}

// --- Interfaces ---
interface BrandInfo {
    name: string;
    logo?: string;
    logoAlt?: string;
    displayType: 'logo' | 'name' | 'logo-name' | 'logo-subtext';
    subtext?: string;
}

// --- Data ---

// Ensure these paths are correct for your project
const phoneBrandsData: BrandInfo[] = [
    { name: 'Apple', logo: '/assets/images/iphone.png', logoAlt: 'Apple Logo', displayType: 'logo' },
    { name: 'Huawei', logo: '/assets/images/huawei.png', logoAlt: 'Huawei Logo', displayType: 'logo' },
    { name: 'Samsung', logo: '/assets/images/samsung.png', logoAlt: 'Samsung', displayType: 'logo' },
    { name: 'Xiaomi', logo: '/assets/images/xiaomi.png', logoAlt: 'Xiaomi MI Logo', displayType: 'logo' },
    { name: 'Oppo', logo: '/assets/images/oppo.png', logoAlt: 'Oppo Logo', displayType: 'logo' },
    { name: 'Vivo', logo: '/assets/images/vivo.png', logoAlt: 'Vivo Logo', displayType: 'logo' },
    { name: 'OnePlus', logo: '/assets/images/oneplus.png', logoAlt: 'OnePlus Logo', displayType: 'logo' },
    { name: 'Honor', logo: '/assets/images/honor.png', logoAlt: 'Honor', displayType: 'logo' },
    { name: 'Realme', logo: '/assets/images/realme.png', logoAlt: 'Realme Logo', displayType: 'logo' },
    { name: 'Redmi', logo: '/assets/images/redmi.png', logoAlt: 'Redmi Logo', displayType: 'logo' },
];


// Models for each brand (Add more as needed)
const brandModels: { [key: string]: string[] } = {
    Apple: [
        'iPhone 7', 'iPhone 7 Plus', 'iPhone 8', 'iPhone 8 Plus',
        'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
        'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
        'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
        'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
        'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
        'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    ],
    Samsung: [
        'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra',
        'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE',
        'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
        'Galaxy A54', 'Galaxy A34',
        // Add more Samsung models
    ],
    Huawei: [
        'P60', 'P60 Pro', 'Mate 60', 'Mate 60 Pro', 'Mate X3', 'Nova 11',
        // Add more Huawei models
    ],
    Xiaomi: [
        'Xiaomi 14', 'Xiaomi 14 Pro', 'Xiaomi 13T', 'Xiaomi 13T Pro', 'Xiaomi 13', 'Xiaomi 13 Lite',
        // Add more Xiaomi models
    ],
    Oppo: [
        'Find N3', 'Find N3 Flip', 'Find X6 Pro', 'Reno 10 Pro+', 'Reno 10', 'A78',
        // Add more Oppo models
    ],
    Vivo: [
        'X100 Pro', 'X100', 'X90 Pro', 'V29', 'Y78', 'iQOO 12 Pro', 'iQOO 12',
        // Add more Vivo/iQOO models
    ],
    OnePlus: [
        'OnePlus 12', 'OnePlus 11', 'OnePlus Open', 'OnePlus Nord 3', 'OnePlus 10T',
        // Add more OnePlus models
    ],
    Honor: [
        'Magic V2', 'Magic 5 Pro', 'Honor 90', 'Honor X9a',
        // Add more Honor models
    ],
    Realme: [
        'Realme GT 5 Pro', 'Realme 11 Pro+', 'Realme 11', 'Realme C55',
        // Add more Realme models
    ],
    Redmi: [
        'Redmi Note 13 Pro+', 'Redmi Note 13', 'Redmi K70 Pro', 'Redmi 12',
        // Add more Redmi models
    ],
    // Add other brands...
    Default: [], // Fallback for unlisted brands
};

interface CaseMaterialInfo { // Interface for material data
    id: string;
    name: string;
    price: string;
    imageUrl: string;
    altText: string;
    description: string;
}

const caseMaterialsData: CaseMaterialInfo[] = [
    {
        id: 'clear', name: 'Clear', price: '$18.00', imageUrl: '/assets/images/clear-case.png', altText: 'Clear phone case',
        description: 'A simple, durable clear case with straight edges. Perfect for showcasing your design while keeping your phone protected.'
    },
    {
        id: 'clear-airbag', name: 'Clear AirBag', price: '$18.00', imageUrl: '/assets/images/clear-airbag-case.png', altText: 'Clear phone case with airbag corners',
        description: 'Transparent with reinforced 4-corner airbag protection for added drop resistance. Keep your phone safe and stylish!'
    },
    {
        id: 'silicone', name: 'Silicone', price: '$18.00', imageUrl: '/assets/images/silicone-cases.png', altText: 'Collection of silicone phone cases',
        description: 'A soft, smooth, and flexible silicone case for a comfortable grip. Available in 10 colors to match any style!'
    },
    {
        id: 'holo', name: 'Holo', price: '$20.00', imageUrl: '/assets/images/holo-case.png', altText: 'Holographic phone case',
        description: 'Eye-catching holographic finish that shifts colors depending on the light angle. Adds a unique flair.'
    },
    {
        id: 'full-wrap', name: 'Full Wrap', price: '$20.00', imageUrl: '/assets/images/full-wrap-case.png', altText: 'Full wrap printed phone case',
        description: 'Design covers the entire case! Available in hard or soft shell. Make sure your design fills the whole area, so adding a colored background is recommended!'
    },
    {
        id: 'mirror', name: 'Mirror', price: '$22.00', imageUrl: '/assets/images/mirror-case.png', altText: 'Mirror finish phone case',
        description: 'A mirror finish that’s both stylish and practical! Keep areas clear in your design for the mirror effect, covering the whole case will hide it!'
    },
];

interface CaseStyleInfo { // <--- NEW: Interface for case style data
    id: string; // Unique identifier (e.g., 'red', 'green')
    name: string; // Display name (e.g., 'Red', 'Green')
    imageUrl: string; // Path to the image
    altText: string; // Alt text for the image
}

const caseStylesData: CaseStyleInfo[] = [
    { id: 'red', name: 'Red', imageUrl: '/assets/images/red-case.png', altText: 'Red phone case' }, // Assuming these are generic case images, adjust paths
    { id: 'green', name: 'Green', imageUrl: '/assets/images/green-case.png', altText: 'Green phone case' },
    { id: 'blue', name: 'Blue', imageUrl: '/assets/images/blue-case.png', altText: 'Blue phone case' },
    { id: 'black', name: 'Black', imageUrl: '/assets/images/black-case.png', altText: 'Black phone case' },
    // Add more styles as needed
];

// No longer need SelectedOptions or onSubmit prop if handling navigation internally


const AppLogo = () => (
    <Image src="/assets/images/logo-gradient.png"
        alt="My App Logo" h={28} w="auto" fit="contain" />
);

// --- Main Component ---
// Removed onReadyToEdit and onSubmit props
export default function ChooseFlowScreen({ onBrandSelect, onModelSelect, onMaterialSelect, onCaseStyleSelect }: ChooseFlowScreenProps) {

    const router = useRouter(); // <-- Initialize useRouter

    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
    const [selectedCaseStyle, setSelectedCaseStyle] = useState<string | null>(null); // State for style selection
    const [openedPopoverId, setOpenedPopoverId] = useState<string | null>(null);

    const modelListRef = useRef<HTMLDivElement>(null);
    const materialListRef = useRef<HTMLDivElement>(null);
    const caseStyleListRef = useRef<HTMLDivElement>(null); // Ref for style list

    // Scroll effects remain the same
    useEffect(() => {
        if (selectedBrand && modelListRef.current) {
            modelListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, [selectedBrand]);

    useEffect(() => {
        if (selectedModel && materialListRef.current) {
            const timer = setTimeout(() => {
                materialListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedModel]);

    useEffect(() => {
        if (selectedMaterial && caseStyleListRef.current) {
            const timer = setTimeout(() => {
                caseStyleListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedMaterial]);


    // Selection handlers remain the same, but ensure they clear downstream state
    const handleBrandSelect = (brandName: string) => {
        const newBrand = selectedBrand === brandName ? null : brandName;
        setSelectedBrand(newBrand);
        setSelectedModel(null);
        setSelectedMaterial(null);
        setSelectedCaseStyle(null);
        setOpenedPopoverId(null);
        if (onBrandSelect) onBrandSelect(newBrand || '');
        console.log("Selected Brand:", newBrand);
    };

    const handleModelSelect = (modelName: string) => {
        const newModel = selectedModel === modelName ? null : modelName;
        setSelectedModel(newModel);
        setSelectedMaterial(null);
        setSelectedCaseStyle(null);
        setOpenedPopoverId(null);
        if (onModelSelect) onModelSelect(newModel || '');
        console.log("Selected Model:", newModel);
    };

    const handleMaterialSelect = (materialId: string) => {
        const newMaterial = selectedMaterial === materialId ? null : materialId;
        setSelectedMaterial(newMaterial);
        setSelectedCaseStyle(null);
        setOpenedPopoverId(null);
        if (onMaterialSelect) {
            const material = caseMaterialsData.find(m => m.id === newMaterial);
            onMaterialSelect(material ? material.name : '');
        }
        console.log("Selected Material ID:", newMaterial);
    };

    const handleCaseStyleSelect = (styleId: string) => {
        const newStyle = selectedCaseStyle === styleId ? null : styleId;
        setSelectedCaseStyle(newStyle);
        if (onCaseStyleSelect) {
            const style = caseStylesData.find(s => s.id === newStyle);
            onCaseStyleSelect(style ? style.name : '');
        }
        console.log("Selected Case Style ID:", newStyle);
    };

    // Function to render the brand selection grid (remains the same)
    const renderBrandItem = (brand: BrandInfo) => {
        const isSelected = selectedBrand === brand.name;
        const commonStyles: MantineStyleProp = {};
        let content;
        switch (brand.displayType) {
            case 'logo':
                content = brand.logo ? (<Image src={brand.logo} alt={brand.logoAlt || brand.name} h={50} w="auto" fit="contain" />) : (<Text size="lg" fw={500}>{brand.name}</Text>); break;
            default:
                content = (<Text size="lg" fw={500}>{brand.name}</Text>);
        }

        return (
            <UnstyledButton
                key={brand.name}
                onClick={() => handleBrandSelect(brand.name)}
                styles={(theme) => ({
                    root: {
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? theme.colors.violet[6] : 'transparent'}`,
                        backgroundColor: isSelected ? theme.colors.violet[0] : 'transparent',
                        '&:hover': {
                            backgroundColor: !isSelected ? theme.colors.gray[0] : undefined
                        }
                    }
                })}
                p={0}
            >
                <AspectRatio ratio={1 / 1}>
                    <Center style={commonStyles}>
                        {content}
                    </Center>
                </AspectRatio>
            </UnstyledButton>
        );
    };

    // Function to render the model selection list (remains the same)
    const renderModelList = () => {
        if (!selectedBrand) return null;
        const modelsToList = brandModels[selectedBrand] || brandModels.Default;

        return (
            <Box ref={modelListRef} mt="xl" pt="xl">
                <Text ta="center" size="xl" fw={700} mb={{ base: 'lg', sm: 'xl' }}>
                    Choose Your Phone Model
                </Text>
                <SimpleGrid
                    cols={2}
                    spacing="sm"
                    verticalSpacing="md"
                >
                    {modelsToList.map((model) => {
                        const isModelSelected = selectedModel === model;
                        return (
                            <UnstyledButton
                                key={model}
                                onClick={() => handleModelSelect(model)}
                                p="xs"
                                styles={(theme) => ({
                                    root: {
                                        borderRadius: '4px',
                                        backgroundColor: isModelSelected ? theme.colors.violet[0] : 'transparent',
                                        transition: 'background-color 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: !isModelSelected ? theme.colors.gray[0] : undefined
                                        }
                                    }
                                })}
                            >
                                <Text
                                    ta="left"
                                    size="sm"
                                    fw={isModelSelected ? 600 : 400}
                                    c={isModelSelected ? 'violet.7' : 'black'}
                                >
                                    {model}
                                </Text>
                            </UnstyledButton>
                        );
                    })}
                </SimpleGrid>
            </Box>
        );
    };

    // Function to render the material list (remains the same)
    const renderMaterialList = () => {
        if (!selectedModel) return null;

        return (
            <Box ref={materialListRef} mt="xl" pt="xl">
                <Text ta="center" size="xl" fw={700} mb={{ base: 'lg', sm: 'xl' }}>
                    Choose Your Case Material
                </Text>
                <Box maw={1000} mx="auto">
                    <SimpleGrid
                        cols={{ base: 2, sm: 3, md: 4 }}
                        spacing="lg"
                        verticalSpacing="lg"
                    >
                        {caseMaterialsData.map((material) => {
                            const isMaterialSelected = selectedMaterial === material.id;
                            const isPopoverOpen = openedPopoverId === material.id;
                            return (
                                <Card
                                    padding={0}
                                    radius="lg"
                                    key={material.id}
                                    withBorder={isMaterialSelected}
                                    style={{
                                        borderColor: isMaterialSelected ? 'var(--mantine-color-violet-6)' : undefined,
                                        borderWidth: isMaterialSelected ? '1px' : '0px',
                                        cursor: 'pointer',
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => { handleMaterialSelect(material.id); setOpenedPopoverId(null); }}
                                >
                                    <Card.Section>
                                        <AspectRatio ratio={1 / 1}>
                                            <Image
                                                src={material.imageUrl}
                                                alt={material.altText}
                                                fallbackSrc="/path/to/placeholder.png"
                                            />
                                        </AspectRatio>
                                    </Card.Section>

                                    <Group justify="space-between" p="sm">
                                        <Box>
                                            <Text fw={500} size="sm">{material.name}</Text>
                                            <Text size="sm" c="dimmed">{material.price}</Text>
                                        </Box>

                                        <Popover
                                            opened={isPopoverOpen}
                                            onClose={() => setOpenedPopoverId(null)}
                                            position="bottom-end"
                                            withArrow
                                            shadow="md"
                                            offset={5}
                                            withinPortal
                                            trapFocus={false}
                                            zIndex={200}
                                            width={280}
                                        >
                                            <Popover.Target>
                                                <ActionIcon
                                                    variant={"outline"}
                                                    color={isMaterialSelected ? "violet" : "gray"}
                                                    radius="xl"
                                                    size="md"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setOpenedPopoverId(isPopoverOpen ? null : material.id);
                                                    }}
                                                >
                                                    <IconChevronDown size={16} />
                                                </ActionIcon>
                                            </Popover.Target>

                                            <Popover.Dropdown p="md">
                                                <Group gap="sm" align="flex-start" wrap="nowrap">
                                                    <ActionIcon
                                                        variant="outline"
                                                        color="gray"
                                                        radius="xl"
                                                        size="sm"
                                                        onClick={(event) => { event.stopPropagation(); setOpenedPopoverId(null); }}
                                                        aria-label="Close description"
                                                    >
                                                        <IconX size={14} />
                                                    </ActionIcon>
                                                    <Text size="sm" lh={1.4} style={{ flex: 1 }}>
                                                        {material.description}
                                                    </Text>
                                                </Group>
                                            </Popover.Dropdown>
                                        </Popover>
                                    </Group>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                </Box>
            </Box>
        );
    };

    // Render function for Case Style List (remains the same)
    const renderCaseStyleList = () => {
        // Only render if a material is selected
        if (!selectedMaterial) return null;

        return (
            // Attach ref and add spacing
            <Box ref={caseStyleListRef} mt="xl" pt="xl">
                <Text ta="center" size="xl" fw={700} mb={{ base: 'lg', sm: 'xl' }}>
                    Choose Your Case Style
                </Text>
                {/* Use a SimpleGrid for the 2x2 layout */}
                <SimpleGrid
                    cols={2} // Force 2 columns as shown in the image
                    spacing="lg"
                    verticalSpacing="lg"
                    maw={400} // Optional: Limit width for better presentation if desired
                    mx="auto" // Center the grid
                >
                    {caseStylesData.map((style) => {
                        const isStyleSelected = selectedCaseStyle === style.id; // Correct variable here
                        return (
                            // Use Card for a similar look to the material list, or a simple UnstyledButton
                            // Card provides padding and rounded corners easily.
                            <Card
                                key={style.id}
                                padding="sm" // Add some internal padding
                                radius="md" // Rounded corners like the image
                                withBorder={isStyleSelected} // Add border if selected
                                style={(theme) => ({
                                    borderColor: isStyleSelected ? theme.colors.violet[6] : undefined,
                                    borderWidth: isStyleSelected ? '2px' : '1px', // Make border a bit thicker when selected
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                                    backgroundColor: isStyleSelected ? theme.colors.violet[0] : 'transparent', // Light background if selected
                                    // Hover effect if not selected
                                    '&:hover': {
                                        // FIX IS HERE: Use !isStyleSelected instead of !isSelected
                                        backgroundColor: !isStyleSelected ? theme.colors.gray[0] : undefined,
                                    },
                                    display: 'flex', // Use flexbox for stacking image and text
                                    flexDirection: 'column', // Stack items vertically
                                    alignItems: 'center', // Center content horizontally
                                })}
                                onClick={() => handleCaseStyleSelect(style.id)}
                            >
                                {/* Use Card.Section for the image area */}
                                <Card.Section>
                                    <AspectRatio ratio={1 / 1} style={{ width: '100%' }}>
                                        <Image
                                            src={style.imageUrl}
                                            alt={style.altText}
                                            fit="contain" // or 'cover' depending on desired look
                                            fallbackSrc="/path/to/placeholder-style.png" // Use a real fallback if possible
                                        />
                                    </AspectRatio>
                                </Card.Section>
                                {/* Text label below the image */}
                                <Text size="sm" mt="xs" ta="center" fw={isStyleSelected ? 600 : 400}>
                                    {style.name}
                                </Text>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            </Box>
        );
    };


    // Check if all required selections are made
    // Updated: Now includes selectedCaseStyle
    const isReadyToEdit = selectedBrand !== null && selectedModel !== null && selectedMaterial !== null && selectedCaseStyle !== null;

    // Function to handle navigation when the button is clicked
    const handleProceedToEditor = () => {
        // This function is called directly by the button
        // Check if all selections are actually made (should be true if button is visible)
        if (selectedBrand && selectedModel && selectedMaterial && selectedCaseStyle) {
            // Construct the URL with query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('brand', selectedBrand);
            queryParams.append('model', selectedModel);
            queryParams.append('material', selectedMaterial);
            queryParams.append('style', selectedCaseStyle);

            const url = `/phone-case-editor?${queryParams.toString()}`;

            console.log('Navigating to editor with:', url);

            // Use Next.js router to navigate
            router.push(url);

        } else {
            console.warn('Attempted to navigate without full selection.');
            // Optionally show an error message
        }
    };


    return (
        <Box style={{ margin: 'auto', background: 'white', minHeight: '100vh', width: '100%' }}>
            {/* Header Section (remains the same) */}
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid #f0f0f0', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '15px' }}> <AppLogo /> </Box>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Text size="sm" component="a" href="#" c="black" style={{ textDecoration: 'none', fontWeight: 500 }}>Sign in</Text>
                </Box>
            </Box>

            {/* Content Area: Render BOTH sections, model list conditionally */}
            <Box p="xl" maw={1200} mx="auto">
                <Suspense fallback={<div>Loading...</div>}>
                    {/* Section 1: Brand Grid (Always Rendered) */}
                    <Box mb="xl">
                        <Text ta="center" size="xl" fw={700} mb={{ base: 'lg', sm: 'xl' }}>
                            Choose Your Phone Brand
                        </Text>
                        <SimpleGrid
                            cols={{ base: 2, xs: 3, sm: 4, md: 5 }}
                            spacing={{ base: 'md', sm: 'lg' }}
                            verticalSpacing={{ base: 'lg', sm: 'xl' }}
                        >
                            {phoneBrandsData.map(renderBrandItem)}
                        </SimpleGrid>
                    </Box>

                    {/* Section 2: Model List (Rendered ONLY if a brand is selected) */}
                    {selectedBrand && renderModelList()}

                    {/* Section 3: Material List (Rendered ONLY if a model is selected) */}
                    {selectedModel && renderMaterialList()}

                    {/* Section 4: Case Style List (Rendered ONLY if a material is selected) */}
                    {selectedMaterial && renderCaseStyleList()}

                    {/* ---- Button to Proceed (Rendered ONLY if all selections are made) ---- */}
                    {isReadyToEdit && (
                        <Box mt="xl" pb="xl" ta="center">
                            <Button
                                type="button" // Use type="button" unless it's part of a form
                                className="my-10" // Tailwind class
                                variant="gradient" // Mantine variant
                                size='xl' // Mantine size
                                radius='xl' // Mantine radius
                                gradient={{ from: '#FFC3FE', to: '#B5F5FC', deg: 90 }} // Mantine gradient
                                styles={{
                                    root: {
                                        filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                                    }
                                }}
                                // Call the internal navigation function directly
                                onClick={handleProceedToEditor}
                            >
                                <p className="drop-shadow-md text-[28px] font-Poppins font-black">Design Your Case</p>
                            </Button>
                        </Box>
                    )}
                    {/* ---- END Button ---- */}

                </Suspense>
            </Box>
        </Box>
    );
}