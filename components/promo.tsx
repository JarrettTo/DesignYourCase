import Image from "next/image";

export default function Promo(){
    return(
        <div className="mt-10 px-5">
            <div className="flex flex-col text-darkPurple">

                <div className="flex justify-center">
                    <Image 
                        src="/assets/images/buy3.png" 
                        alt="Buy 3 for Free Delivery" 
                        width={600} 
                        height={450}
                        className="object-contain" 
                    />
                </div>
                <div className="text-xs flex justify-center md:text-xl">
                    Automatically applied during check-out.
                </div>
            </div>
        </div>
    )
}