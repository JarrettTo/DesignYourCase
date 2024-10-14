import Link from "next/link";

type ItemCardProps = {
    productName: string;
    link: string;
    index: number;
}

export default function ItemCard({productName, link, index}: ItemCardProps) {
    
    return(
    <Link href={{ 
            pathname: `/product-selection/${index}`, 
            query: { link } 
        }}
    >
        <div className="w-[273px] h-auto mx-[50px] px-2 rounded-lg transition-all mb-14 cursor-pointer bg-white hover:drop-shadow-2xl">
            <div className="w-full aspect-square bg-[#c8bfdc] flex items-center justify-center">
                <img className="w-[126.45px] h-[229.13px]" src="https://via.placeholder.com/126x229" />
            </div>
            <p className="text-black text-base font-semibold font-Poppins">{productName}</p>
        </div>
    </Link>
    );
}