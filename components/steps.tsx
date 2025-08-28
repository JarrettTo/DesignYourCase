import Image from "next/image";
import Link from "next/link";

export default function Steps() {
    return(
        <div className="mt-16">
            <div className="flex flex-col items-center px-5">
                <p className="font-bold font-[LoubagBold] text-darkPurple text-center text-2xl md:text-4xl">
                    4 Easy Steps!
                </p>
                <div className="flex flex-col py-5 gap-7 md:text-2xl text-darkPurple md:mt-10">
                    <div className="flex-flex-col bg-lightPurple rounded-xl p-3 md:p-4 text-center md:py-5">
                        <p className="font-bold text-sm md:text-3xl">
                            CHOOSE YOUR PHONE MODEL
                        </p>
                        <p className="text-xs md:text-lg">
                        Apple & Android phone models available
                        </p>
                    </div>
                    
                    <div className="flex-flex-col bg-lightPurple rounded-xl py-3  px-3 md:px-10 text-center md:py-5">
                        <p className="font-bold text-sm md:text-3xl">
                            CHOOSE YOUR CASE STYLE
                        </p>
                        <p className="text-xs md:text-lg">
                            Find the Perfect Case for your phone!
                        </p>
                    </div>

                   

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-3 md:p-4 text-center md:py-5">
                        <p className="font-bold text-sm md:text-3xl">
                            DESIGN YOUR CASE
                        </p>
                        <p className="text-xs md:text-lg">
                            Customize with images, text, and stickers
                        </p>
                    </div>

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-3 md:p-4 text-center md:py-5">
                        <p className="font-bold text-sm  md:text-3xl">
                            ADD TO CART/CHECKOUT
                        </p>
                        <p className="text-xs md:text-lg">
                            Complete your creation
                        </p>
                    </div>
                </div>

                <Link href="/product-selection">
                        <button className="bg-gradient-to-r mt-10 from-pink to-[#83feff] py-3 px-9 rounded-full text-white font-Poppins font-bold text-xl md:text-2xl md:py-4 md:px-9 ">
                            <p className=" drop-shadow-md">
                                Start Designing
                            </p>
                        </button>
                    </Link>
                
            </div>
        </div>
    );
}