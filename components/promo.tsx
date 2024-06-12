import Image from "next/image";

export default function Promo(){
    return(
        <div className="mt-10 px-10">
            <div className="flex flex-col">
                <div className="flex flex-row items-center justify-between">
                    <p className="font-bold text-purple text-3xl ">
                        Buy 3 for
                    </p>
                    
                    <div>
                        <Image src="/assets/images/star.svg" alt="alt" width={50} height={50} />
                    </div>
                </div>
                <div className="flex justify-center text-purple font-bold text-4xl font-['LoubagBold']">
                    Free Delivery!
                </div>
                <div className="text-purple text-sm">
                    Automatically applied during check-out.
                </div>
            </div>
        </div>
    )
}