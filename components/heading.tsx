import Image from "next/image";

export default function Heading(){
    return(
        <div className="bg-lightPurple mt-10 py-5 px-3 md:p-10 ">
            <div className="flex flex-row gap-8 md:gap-14 md:justify-center">
                <div className="flex items-center">
                    <Image 
                        src="/assets/images/phone-case.png" 
                        alt="Phone Case" 
                        width={400} 
                        height={400}
                        className="md:w-52 md:h-"
                    />
                </div>
                
                <div className="flex flex-col gap-2 md:gap-6 md:w-2/3">
                    <p className="font-[LoubagBold] text-lg md:text-6xl">
                        Welcome to DYC!
                    </p>

                    <div className="flex flex-col text-xs md:text-3xl gap-5 md:gap-10 ">
                        <p>
                        Customizing a phone case has never been easier! With a vast selection of phone models, you&apos;re sure to find the perfect fit for your device.
                        </p>
                        <p>
                        Express yourself with every case; whether with unique designs, heartfelt messages, or favorite photos of loved ones and idols.
                        </p>
                        <p>
                            Don&apos;t wait - Get your own personalized phone case now!
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}