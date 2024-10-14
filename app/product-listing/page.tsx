import ProductListing from "@/components/product-listing";

export default function Home() {
    return (
      <main className="flex flex-col w-full overflow-x-hidden">
        <ProductListing/>
      </main>
    );
  }