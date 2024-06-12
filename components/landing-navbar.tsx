import Image from "next/image";

export default function LandingNavbar() {
    return(
        <div className="flex flex-row justify-between items-center w-full mt-5 p-10 h-10">
            <Image src="/assets/images/logo-gradient.svg" alt="alt" width={60} height={60} />
            <Image src="/assets/images/burger-menu.svg" alt="alt" width={30} height={30} />
        </div>
    );
}