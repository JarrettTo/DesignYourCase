'use client'

import '@mantine/core/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import ProductSelection from "@/components/product-selection";
import PhoneCaseEditor from "@/components/case-editor";

type CaseType = 'Transparent' | 'Colored';

const theme = createTheme({
  colors: {
    'bright-pink': [
      "#ffeaff",
      "#ffd0fe",
      "#fe9dfc",
      "#fd67fa",
      "#fc3cf9",
      "#fd25f8",
      "#fd19f9",
      "#e20cde",
      "#c900c6",
      "#af00ae"
    ],
    'lilac-purple': [
      "#efebff",
      "#dad3fd",
      "#b2a3f7",
      "#8770f2",
      "#6446ed",
      "#4d2beb",
      "#411deb",
      "#3312d1",
      "#2b0ebc",
      "#2208a6"
    ],
    'bright-blue': [
      "#e0feff",
      "#cdfafe",
      "#9ff2fb",
      "#6eebf8",
      "#49e4f6",
      "#34e0f5",
      "#22dff4",
      "#09c5da",
      "#00b0c3",
      "#0099ab"
    ]
  },
})

interface SelectedOptions {
  id: number;
  phoneModel: string;
  phoneBrand: string;
  thumbnail: string;
  color: string;
  material: string;
  seller: string;
  type: string;
  variation: string;
  price: number | null;
  mockup: string | null;
}

function ProductSelectInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    id: 0,
    phoneModel: '',
    phoneBrand: '',
    thumbnail: '',
    color: '',
    material: '',
    seller: '',
    type: 'Transparent',
    variation: '',
    price: null,
    mockup: null
  });

  const handleProductSelection = (options: SelectedOptions) => {
    console.log("Selected Options:", options);
    setSelectedOptions(options);
  };

  return (
    <MantineProvider theme={theme}>
      <main className="flex flex-col w-full overflow-x-hidden">
        {selectedOptions.phoneModel && selectedOptions.material ? (
          <PhoneCaseEditor
            id={selectedOptions.id}
            phoneModel={selectedOptions.phoneModel}
            phoneBrand={selectedOptions.phoneBrand}
            thumbnail={selectedOptions.thumbnail}
            color={selectedOptions.color}
            material={selectedOptions.material}
            seller={selectedOptions.seller}
            type={selectedOptions.type}
            variation={selectedOptions.variation}
            price={selectedOptions.price}
            mockup={selectedOptions.mockup}
          />
        ) : (
          <ProductSelection onSubmit={handleProductSelection} />
        )}
      </main>
    </MantineProvider>
  );
}

export default function ProductSelect() {
  return (
    <Suspense>
      <ProductSelectInner />
    </Suspense>
  );
}
