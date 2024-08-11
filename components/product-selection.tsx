import Image from "next/image";

export default function ProductSelection() {
    return(
        <div className="w-full h-full flex flex-col items-center justify-start bg-white">
            <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Choose your case</p>

            <div className="py-10 flex flex-row justify-center items-center">
                <div className="flex flex-col justify-center items-center mx-20">
                    <Image 
                        src="/assets/images/transparent-case.png"
                        alt="transparent case"
                        width={170}
                        height={170}
                    />
                </div>
                <div className="flex flex-col justify-center items-center mx-20">
                    <Image 
                        src="/assets/images/colored-case.png"
                        alt="colored case"
                        width={180}
                        height={180}
                    />
                </div>
            </div>
        </div>
    )
}