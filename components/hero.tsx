import Image from "next/image";

export default function Hero() {
    return(
        <div className="flex flex-col">
            <div className="flex flex-col">
                <div className="absolute -right-14">
                    <Image src="/assets/images/star.svg" alt="star" width={150} height={150} />
                </div>
                <div className="flex justify-center">
                    <Image src="/assets/images/hero.svg" alt="design your case" width={300} height={100} />
                </div>
                <div className="absolute -left-12 top-60">
                    <Image src="/assets/images/spike.svg" alt="spike" width={150} height={150} />
                </div>
                <div className="flex justify-center">
                    <button className="bg-gradient-to-r from-pink to-skyBlue py-2 px-7 rounded-2xl text-white font-bold">
                        Get Started
                    </button>
                </div>
            </div>

        </div>
    );
}