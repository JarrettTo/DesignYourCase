import Image from "next/image";

export default function Heading(){
    return(
        <div className="bg-lightPurple p-8 sm:p-10 md:p-16">
            <div className="flex flex-row gap-8 md:gap-14 md:justify-center">
                <div className="flex items-center">
                    <Image 
                        src="/assets/images/phone-case.png" 
                        alt="Phone Case" 
                        width={350} 
                        height={300}
                        className="md:w-45 sm:w-40"
                    />
                </div>
                
                <div className="flex flex-col gap-2 md:gap-6 sm:w-2/3">
                    <p className="font-Poppins font-bold text-lg sm:text-3xl md:text-4xl leading-tight">
                        Tired of boring cases?<br/> <span className="italic">Design your own!</span> 
                     </p>

                    <div className="flex flex-col text-xs sm:text-base md:text-2xl gap-5 md:gap-10 ">
                        <p>
                        Choose from <span className="font-bold">tons of phone models</span> and create a case that matches your vibe — whether it’s an aesthetic design, a bold statement, or a favorite photo.
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