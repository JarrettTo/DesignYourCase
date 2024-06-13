import Image from "next/image";

export default function Order(){
    return(
        <div className="mt-10 bg-lightPurple flex">
            <div className="flex flex-row p-3 justify-center items-center gap-2">
                <div className="flex flex-col bg-white rounded-xl items-center px-3 py-3 gap-2 ">
                    <Image src="/assets/images/spike.svg" alt="alt" width={50} height={50} />
                    <p className="font-bold">
                        Payment
                    </p>
                    <p className="text-center text-[9px]">
                        Bank Transfer by BIBD/Baiduri (upload receipt during checkout)
                    </p>
                    
                </div>

                <div className="flex flex-col bg-white rounded-xl items-center px-3 py-3 gap-2">
                    <Image src="/assets/images/spike.svg" alt="alt" width={50} height={50} />
                    <p className="font-bold">
                        ETA
                    </p>
                    <p className="text-center text-[9px]">
                        Your case will arrive in 2-3 weeks after payment is confirmed!
                    </p>
                    
                </div>

                <div className="flex flex-col bg-white rounded-xl items-center px-3 py-3 gap-2">
                    <Image src="/assets/images/spike.svg" alt="alt" width={50} height={50} />
                    <p className="font-bold">
                        Collection
                    </p>
                    <p className="text-center text-[9px]">
                    $5 Delivery fee to all Brunei areas or Pick-Up at Kg Jangsak
                    </p>
                    
                </div>
                
            </div>
        </div>
    );
}