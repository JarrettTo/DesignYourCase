import Image from "next/image";
import Link from "next/link";

export default function Footer(){
    return(
        <div className="my-10">
            <div className="flex flex-col items-center gap-2">
                <p className="text-xs italic">
                    DYC, Express Yourself with Every Case
                </p>
                <div className="flex flex-row items-center justify-center">
                    <Image src="/assets/images/instagram.svg" alt="alt" width={20} height={20} />
                    <Link href="#"
                        className="text-xs"
                    >
                        dyc.brunei
                    </Link>
                </div>
            </div>
        </div>
    );
}