import Image from "next/image";

export default function Steps() {
    return(
        <div className="mt-10">
            <div className="flex flex-col items-center">
                <p className="font-bold text-darkPurple text-center text-2xl">
                    4 Easy Steps!
                </p>
                <div className="flex flex-col px-10 py-5 gap-4 ">
                    <div className="flex-flex-col bg-lightPurple rounded-xl p-2 text-center">
                    <p className="font-bold">
                        CHOOSE YOUR CASE STYLE
                    </p>
                    <p className="text-xs">
                        Find the Perfect Case for your phone!
                    </p>
                    </div>

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-2 text-center ">
                    <p className="font-bold">
                        CHOOSE YOUR PHONE MODEL
                    </p>
                    <p className="text-xs">
                        Discover a vast selection of phone models
                    </p>
                    </div>

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-2 text-center">
                    <p className="font-bold">
                        DESIGN YOUR CASE
                    </p>
                    <p className="text-xs">
                        Customize with images, text, and stickers
                    </p>
                    </div>

                    <div className="flex-flex-col bg-lightPurple rounded-xl p-2 text-center">
                    <p className="font-bold">
                        ADD TO CART/CHECKOUT
                    </p>
                    <p className="text-xs">
                        Complete your creation
                    </p>
                    </div>
                </div>

                <button className="bg-gradient-to-r from-pink to-skyBlue py-2 px-7 rounded-2xl text-white font-bold w-3/6">
                        Start Designing
                </button>
                
            </div>
        </div>
    );
}