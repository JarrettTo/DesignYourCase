import Image from "next/image";

export default function Heading(){
    return(
        <div className="bg-lightPurple mt-10">
            <div className="flex flex-row justify-center p-10">
                <Image 
                    src="/assets/images/phone-case.png" 
                    alt="Phone Case" 
                    width={100} 
                    height={100}
                    className=""
                />
                <div className="flex flex-col">
                    <p className="">

                    </p>
                </div>
            </div>
        </div>
    );
}