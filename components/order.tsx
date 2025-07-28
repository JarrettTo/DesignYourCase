import Image from "next/image";

export default function Order(){
    return(
        <div className="mt-10 bg-lightPurple flex justify-center md:py-10">
            <div className="flex flex-row p-3 justify-center items-center gap-2 md:gap-20 md:px-40">
                <div className="flex flex-col bg-white rounded-3xl items-center px-3 py-3 gap-2 md:py-10 md:gap-7 md:min-h-[25em]">
                    <Image 
                    src="/assets/images/payment.png" 
                    alt="alt" 
                    width={50} 
                    height={50}
                    className="md:h-[100px] md:w-[100px]" 
                />
                    <p className="font-bold md:text-4xl">
                        Payment
                    </p>
                    <p className="text-center text-[9px] md:text-2xl">
                        Bank Transfer by BIBD/Baiduri<br /> (upload receipt during checkout)
                    </p>
                    
                </div>

                <div className="flex flex-col bg-white rounded-3xl items-center px-3 py-3 gap-2 md:py-10 md:gap-7 md:min-h-[25em]">
                    <Image 
                        src="/assets/images/eta.png" 
                        alt="alt" 
                        width={50} 
                        height={50}
                        className="md:h-[100px] md:w-[100px]" 
                    />
                    <p className="font-bold md:text-4xl">
                        ETA
                    </p>
                    <p className="text-center text-[9px] md:text-2xl">
                        Your case will arrive in 2-3 weeks<br /> after payment is confirmed!
                    </p>
                    
                </div>

                <div className="flex flex-col bg-white rounded-3xl items-center px-3 py-3 gap-2 md:py-10 md:gap-7 md:min-h-[25em]">
                    <Image 
                        src="/assets/images/collection.png" 
                        alt="alt" 
                        width={50} 
                        height={50}
                        className="md:h-[100px] md:w-[100px]" 
                    />
                    <p className="font-bold md:text-4xl">
                        Collection
                    </p>
                    <p className="text-center text-[9px] md:text-2xl">
                        $5 Delivery fee to all Brunei areas<br /> or Pick-Up at Kg Jangsak
                    </p>
                    
                </div>
                
            </div>
        </div>
    );
}