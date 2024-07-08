import Image from "next/image";

export default function Hero() {
    return(
        <div className="flex flex-col mt-24 md:mt-10 gap-10 h-[35vh] md:min-h-screen justify-center">
            
            <div className="relative">
                <div className="absolute -top-20 md:-top-16 -right-12 md:-right-28">
                    <Image 
                        src="/assets/images/star.svg" 
                        alt="star" 
                        width={130} 
                        height={130} 
                        className="md:w-[300px] md:h-[300px]"
                    />
                </div>
                <div className="absolute top-32 -left-11 md:top-60 md:-left-28">
                    <Image 
                        src="/assets/images/spike.svg" 
                        alt="spike" 
                        width={130} 
                        height={130}
                        className="md:w-[300px] md:h-[300px]"                    
                    />
                </div>
                
            </div>
            <div className="flex justify-center self-center">
                    <Image 
                        src="/assets/images/hero.svg" 
                        alt="Design Your Case" 
                        width={370} 
                        height={300} 
                        className="md:w-[1000px] md:h-[350px]"
                    />
                </div>
            <div className="flex justify-center mt-10">
                    <button className="bg-gradient-to-r from-pink to-skyBlue py-3 px-9 rounded-full text-white font-bold text-xl md:text-5xl md:py-4 md:px-7 ">
                        <p className=" drop-shadow-md">
                            Get Started
                        </p>
                    </button>
            </div>

        </div>
    );
}