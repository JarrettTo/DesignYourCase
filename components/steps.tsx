import Image from "next/image";

export default function Steps() {
    return(
        <div className="mt-10">
            <div className="flex flex-col items-center">
                <p className="font-bold font-[LoubagBold] text-darkPurple text-center text-2xl md:text-6xl">
                    4 Easy Steps!
                </p>
                <div className="flex flex-col py-5 gap-4 md:text-2xl text-darkPurple md:mt-10">
                    <div className="flex-flex-col bg-lightPurple rounded-xl py-3 px-10 text-center md:py-5">
                        <p className="font-bold md:text-3xl">
                            CHOOSE YOUR CASE STYLE
                        </p>
                        <p className="text-xs md:text-lg">
                            Find the Perfect Case for your phone!
                        </p>
                    </div>

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-2 text-center md:py-5">
                        <p className="font-bold md:text-3xl">
                            CHOOSE YOUR PHONE MODEL
                        </p>
                        <p className="text-xs md:text-lg">
                            Discover a vast selection of phone models
                        </p>
                    </div>

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-2 text-center md:py-5">
                        <p className="font-bold md:text-3xl">
                            DESIGN YOUR CASE
                        </p>
                        <p className="text-xs md:text-lg">
                            Customize with images, text, and stickers
                        </p>
                    </div>

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-2 text-center md:py-5">
                        <p className="font-bold md:text-3xl">
                            ADD TO CART/CHECKOUT
                        </p>
                        <p className="text-xs md:text-lg">
                            Complete your creation
                        </p>
                    </div>
                </div>

                <button className="bg-gradient-to-r from-pink to-skyBlue py-2 md:py-4 px-7 md:px-9 rounded-full text-white font-bold text-xl md:text-3xl ">
                        Start Designing
                </button>
                
            </div>
        </div>
    );
}