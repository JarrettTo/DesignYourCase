import Image from "next/image";

export default function Hero() {
    return(
        <div className="flex flex-col md:-mt-10 h-screen">
            <div className="relative flex flex-col">
                <div className="absolute -right-14 md:-right-20">
                    <Image 
                        src="/assets/images/star.svg" 
                        alt="star" 
                        width={150} 
                        height={150} 
                        className="md:w-48 md:h-48"
                    />
                </div>
                <div className="flex justify-center">
                    <Image 
                        src="/assets/images/hero.svg" 
                        alt="design your case" 
                        width={300} 
                        height={300} 
                        className="md:w-[500px] md:h-[470px]"
                    />
                </div>
                <div className="absolute -left-14 top-60 md:-left-20">
                    <Image 
                        src="/assets/images/spike.svg" 
                        alt="spike" 
                        width={150} 
                        height={150}
                        className="md:w-48 md:h-48"                    
                    />
                </div>
                <div className="flex justify-center">
                    <button className="bg-gradient-to-r from-pink to-skyBlue py-2 px-7 rounded-2xl text-white font-bold md:text-4xl md:py-4 md:px-7 md:rounded-3xl">
                        Get Started
                    </button>
                </div>
            </div>

        </div>
    );
}