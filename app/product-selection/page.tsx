import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

import ProductSelection from "@/components/product-selection";


export default function Home() {
    return (
    <MantineProvider>
        <main className="flex flex-col w-full overflow-x-hidden">
            <ProductSelection/>
        </main>
    </MantineProvider>
    );
  }