import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

export default function Footer(){
    return(
        <div className="my-10">
            <div className="flex flex-col items-center gap-4">
                <p className="text-xs italic">
                    DYC Brunei - You Design, We Print.
                </p>
                <div className="flex flex-col items-center gap-3">
                    <div className="flex flex-row items-center justify-center gap-2">
                        <Link 
                            href="#"
                            className="text-xs flex flex-row items-center gap-2"
                        >
                            <Image src="/assets/images/instagram.svg" alt="alt" width={20} height={20} />
                            <p>designyourcase.co</p>
                        </Link>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-2">
                        <FaWhatsapp className="text-green-500" size={20} />
                        <p className="text-xs">+673 721 3869</p>
                    </div>
                </div>
            </div>
        </div>
    );
}