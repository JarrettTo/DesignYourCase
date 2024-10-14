'use client'


import '@mantine/core/styles.css';
import { MantineProvider, createTheme, Button } from '@mantine/core';

import ProductSelection from "@/components/product-selection";
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

export default function ProductSelect() {
    return (
    <MantineProvider theme={theme}>
        <main className="flex flex-col w-full overflow-x-hidden">
            <ProductSelection/>
        </main>
    </MantineProvider>
    );
  }