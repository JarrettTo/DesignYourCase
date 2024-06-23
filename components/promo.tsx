import Image from "next/image";

export default function Promo(){
    return(
        <div className="mt-10 px-10">
            <div className="flex flex-col text-darkPurple">
                <div className="flex flex-row items-center justify-between ">
                    
                    <div className="font-bold text-3xl md:text-5xl md:pl-72">
                        Buy 3 for
                    </div>
                    
                    <div className="absolute right-10 md:right-[400px]">
                        <Image 
                        src="/assets/images/star-flipped.svg" 
                        alt="alt" 
                        width={80} 
                        height={100}
                        className="md:w-[120px] md:h-[120px]" 
                    />
                    </div>
                </div>
                <div className="flex justify-center font-bold text-4xl font-['LoubagBold'] ml-7 md:text-7xl md:mt-4 md:mb-4">
                    Free Delivery!
                </div>
                <div className="text-xs flex justify-center md:text-xl">
                    Automatically applied during check-out.
                </div>
            </div>
        </div>
    )
}