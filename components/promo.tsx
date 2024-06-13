import Image from "next/image";

export default function Promo(){
    return(
        <div className="mt-10 px-10">
            <div className="flex flex-col text-darkPurple">
                <div className="flex flex-row items-center justify-between">
                    <p className="font-bold text-3xl ">
                        Buy 3 for
                    </p>
                    
                    <div className="absolute right-10">
                        <Image src="/assets/images/star-flipped.svg" alt="alt" width={80} height={100} />
                    </div>
                </div>
                <div className="flex justify-center font-bold text-4xl font-['LoubagBold'] ml-7">
                    Free Delivery!
                </div>
                <div className="text-xs flex justify-center">
                    Automatically applied during check-out.
                </div>
            </div>
        </div>
    )
}