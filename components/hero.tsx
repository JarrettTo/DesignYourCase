import Image from "next/image";

export default function Hero() {
    return(
        <div className="flex flex-col md:-mt-10 h-[50vh] md:min-h-screen">
            <div className="relative flex flex-col gap-20 md:gap-0 h-full md:justify-start justify-center">
                <div className="absolute top-2 -right-14 md:-right-28">
                    <Image 
                        src="/assets/images/star.svg" 
                        alt="star" 
                        width={150} 
                        height={150} 
                        className="md:w-[300px] md:h-[300px]"
                    />
                </div>
                <div className="flex justify-center">
                    <Image 
                        src="/assets/images/hero.svg" 
                        alt="design your case" 
                        width={350} 
                        height={300} 
                        className="md:w-[1000px] md:h-[500px]"
                    />
                </div>
                <div className="absolute -left-14 md:top-60 md:-left-28">
                    <Image 
                        src="/assets/images/spike.svg" 
                        alt="spike" 
                        width={150} 
                        height={150}
                        className="md:w-[300px] md:h-[300px]"                    
                    />
                </div>
                <div className="flex justify-center">
                    <button className="bg-gradient-to-r from-pink to-skyBlue py-2 px-7 rounded-full text-white font-bold text-2xl md:text-4xl md:py-4 md:px-7 md:rounded-3xl">
                        Get Started
                    </button>
                </div>
            </div>

        </div>
    );
}