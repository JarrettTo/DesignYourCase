import Link from "next/link";
import Image from "next/image";

type ItemCardProps = {
    productName: string;
    index: number;
    productId: number;
    thumbnail?: string;
}

export default function ItemCard({productName, index, productId, thumbnail}: ItemCardProps) {
    
    return(
    <Link href={{ 
            pathname: `/product-selection/${index}`,
            query: { productId }
        }}
    >
        <div className="w-[273px] h-auto mx-[50px] px-2 rounded-lg transition-all mb-14 cursor-pointer bg-white hover:drop-shadow-2xl">
            <div className="w-full aspect-square bg-[#c8bfdc] flex items-center justify-center">
                {thumbnail ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={thumbnail}
                            alt={productName}
                            fill
                            className="object-contain"
                        />
                    </div>
                ) : (
                    <img className="w-[126.45px] h-[229.13px]" src="https://via.placeholder.com/126x229" />
                )}
            </div>
            <p className="text-black text-base font-semibold font-Poppins">{productName}</p>
        </div>
    </Link>
    );
}