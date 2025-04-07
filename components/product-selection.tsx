'use client'

import { SimpleGrid, Image, Box, Text, UnstyledButton, AspectRatio, Center, MantineStyleProp } from '@mantine/core'; // Added MantineStyleProp
import { useEffect, useRef, useState } from "react";
import { Suspense } from "react";

// --- Interfaces ---
interface BrandInfo {
    name: string;
    logo?: string;
    logoAlt?: string;
    displayType: 'logo' | 'name' | 'logo-name' | 'logo-subtext';
    subtext?: string;
}

interface ChooseBrandScreenProps {
    onBrandSelect?: (brandName: string) => void;
    onModelSelect?: (modelName: string) => void; // Add callback for model selection
}

// --- Data ---

// Ensure these paths are correct for your project
const phoneBrandsData: BrandInfo[] = [
    { name: 'Apple', logo: '/assets/images/iphone.png', logoAlt: 'Apple Logo', displayType: 'logo' },
    { name: 'Huawei', logo: '/assets/images/huawei.png', logoAlt: 'Huawei Logo', displayType: 'logo-name' },
    { name: 'Samsung', logo: '/assets/images/samsung.png', logoAlt: 'Samsung', displayType: 'name' },
    { name: 'Xiaomi', logo: '/assets/images/xiaomi.png', logoAlt: 'Xiaomi MI Logo', displayType: 'logo' },
    { name: 'Oppo', logo: '/assets/images/oppo.png', logoAlt: 'Oppo Logo', displayType: 'logo' },
    { name: 'Vivo', logo: '/assets/images/vivo.png', logoAlt: 'Vivo Logo', displayType: 'logo' },
    { name: 'OnePlus', logo: '/assets/images/oneplus.png', logoAlt: 'OnePlus Logo', displayType: 'logo' },
    { name: 'Honor', logo: '/assets/images/honor.png', logoAlt: 'Honor', displayType: 'name' },
    { name: 'Realme', logo: '/assets/images/realme.png', logoAlt: 'Realme Logo', displayType: 'logo' },
    { name: 'Redmi', logo: '/assets/images/redmi.png', logoAlt: 'Redmi Logo', subtext: 'by Xiaomi', displayType: 'logo-subtext' },
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


const AppLogo = () => (
    <Image src="/assets/images/logo-gradient.png"
        alt="My App Logo" h={28} w="auto" fit="contain" />
);

// --- Main Component ---
export default function ChooseBrandScreen({ onBrandSelect, onModelSelect }: ChooseBrandScreenProps) {
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null); // State for selected model
    const modelListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if a brand IS selected AND the ref is attached to the element
        if (selectedBrand && modelListRef.current) {
            modelListRef.current.scrollIntoView({
                behavior: 'smooth', // Use smooth scrolling
                block: 'start'     // Align the top of the model list with the top of the viewport
            });
        }
    }, [selectedBrand]);

    const handleBrandSelect = (brandName: string) => {

        if (selectedBrand === brandName) {
            setSelectedBrand(null);
            setSelectedModel(null);
            return;
        }

        setSelectedBrand(brandName);
        setSelectedModel(null); // Reset model when brand changes
        if (onBrandSelect) {
            onBrandSelect(brandName);
        }
        console.log("Selected Brand:", brandName);
    };

    const handleModelSelect = (modelName: string) => {
        setSelectedModel(modelName);
        if (onModelSelect) {
            onModelSelect(modelName);
        }
        console.log("Selected Model:", modelName);
        // You might navigate or trigger further actions here
    };

    // Function to render the brand selection grid
    const renderBrandItem = (brand: BrandInfo) => {
        const isSelected = selectedBrand === brand.name;
        const commonStyles: MantineStyleProp = { /* ... same styles as before ... */ };
        let content; // ... same content logic as before ...
        switch (brand.displayType) {
            case 'logo':
                content = brand.logo ? ( <Image src={brand.logo} alt={brand.logoAlt || brand.name} h={50} w="auto" fit="contain" /> ) : ( <Text size="lg" fw={500}>{brand.name}</Text> ); break;
            case 'name':
                content = <Text size="xl" fw={700} c={isSelected ? '#7359b5' : 'black'}>{brand.name.toUpperCase()}</Text>; break; // Change text color too?
            case 'logo-name':
                content = ( <> {brand.logo && <Image src={brand.logo} alt={brand.logoAlt || brand.name} h={40} w="auto" fit="contain" mb={5}/>} <Text size="sm" fw={600} c={isSelected ? '#7359b5' : 'black'} mt="xs">{brand.name.toUpperCase()}</Text> </> ); break;
             case 'logo-subtext':
                 content = ( <> {brand.logo && <Image src={brand.logo} alt={brand.logoAlt || brand.name} h={40} w="auto" fit="contain" mb={5} />} <Text size="lg" fw={700} c={isSelected ? '#7359b5' : 'black'}>{brand.name}</Text> {brand.subtext && <Text size="xs" c="dimmed">{brand.subtext}</Text>} </> ); break;
            default: content = <Text size="lg" fw={500}>{brand.name}</Text>;
        }

        return (
            <UnstyledButton
                key={brand.name}
                onClick={() => handleBrandSelect(brand.name)}
                // Apply styles for selection and hover
                styles={(theme) => ({
                    root: {
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? theme.colors.violet[6] : 'transparent'}`, // Use theme color
                        backgroundColor: isSelected ? theme.colors.violet[0] : 'transparent', // Light background if selected
                        '&:hover': {
                            backgroundColor: !isSelected ? theme.colors.gray[0] : undefined // Hover only if not selected
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

     // Function to render the model selection list (highlighting logic is the same)
     const renderModelList = () => {
        // Get models, handle null selection - same as before
        if (!selectedBrand) return null; // Don't render if no brand selected
        const modelsToList = brandModels[selectedBrand] || brandModels.Default;

        return (
            // Add margin top for separation, add the ref here!
            <Box ref={modelListRef} mt="xl" pt="xl">
                <Text ta="center" size="xl" fw={700} mb={{ base: 'lg', sm: 'xl' }}>
                    Choose Your Phone Model
                </Text>
                <SimpleGrid
                    cols={2} // Always 2 columns
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
                                styles={(theme) => ({ // Use styles prop for theme access
                                    root: {
                                        borderRadius: '4px',
                                        backgroundColor: isModelSelected ? theme.colors.violet[0] : 'transparent', // Light purple bg
                                        transition: 'background-color 0.2s ease',
                                        '&:hover': {
                                           backgroundColor: !isModelSelected ? theme.colors.gray[0] : undefined // Hover only if not selected
                                        }
                                    }
                                })}
                            >
                                <Text
                                    ta="left"
                                    size="sm"
                                    fw={isModelSelected ? 600 : 400}
                                    c={isModelSelected ? 'violet.7' : 'black'} // Use theme color
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


    return (
        <Box style={{ margin: 'auto', background: 'white', minHeight: '100vh', width: '100%' }}>
            {/* Header Section (remains the same) */}
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid #f0f0f0', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                 <Box style={{ display: 'flex', alignItems: 'center', gap: '15px' }}> <AppLogo /> </Box>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                     {/* <StatusBarIcons /> */}
                     <Text size="sm" component="a" href="#" c="black" style={{ textDecoration: 'none', fontWeight: 500 }}>Sign in</Text>
                </Box>
            </Box>

            {/* Content Area: Render BOTH sections, model list conditionally */}
            <Box p="xl" maw={1200} mx="auto">
                <Suspense fallback={<div>Loading...</div>}>
                    {/* Section 1: Brand Grid (Always Rendered) */}
                    <Box mb="xl"> {/* Add margin below brand grid */}
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

                </Suspense>
            </Box>
        </Box>
    );
}