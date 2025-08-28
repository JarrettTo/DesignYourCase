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
                    Customized Cases Brunei
                     </p>

                    <div className="flex flex-col font-Poppins text-xs sm:text-base md:text-2xl gap-5 md:gap-10 ">
                        <p>
                        Tired of boring cases? Design your own! Whether it’s a favourite photo, a silly design, a
bold statement or just for the aesthetics. Make a 1 of 1 phone case that’s as unique as
you.
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