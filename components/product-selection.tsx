import Image from "next/image";
import { Button } from '@mantine/core';

export default function ProductSelection() {
    return(
    <div className="w-full h-full flex flex-col items-center justify-start">
        <div className="h-screen w-full bg-white flex flex-col items-center justify-start">
            <p className="mt-20 font-Loubag text-[30px] text-[#A594F6]">Choose your case</p>

            <div className="py-10 flex flex-row justify-end items-center">
                <div className="flex flex-col justify-center items-center mx-20 w-[200px]">
                    <Image 
                        src="/assets/images/transparent-case.png"
                        alt="transparent case"
                        width={170}
                        height={170}
                        className="mb-[30px]"
                    />
                    <Button variant="filled" color="#A594F6" radius="xl" fullWidth size="md"
                        styles={{
                            root: {
                                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                            }
                        }}
                    >
                        <p className="drop-shadow-md text-[23px] font-Poppins font-black">Transparent</p>
                    </Button>
                </div>
                <div className="flex flex-col justify-center items-center mx-20 w-[200px]">
                    <Image 
                        src="/assets/images/colored-case.png"
                        alt="colored case"
                        width={180}
                        height={180}
                        className="mb-[30px]"
                    />
                    <Button variant="filled" color="#A594F6" radius="xl" fullWidth size="md"
                        styles={{
                            root: {
                                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                            }
                        }}
                    >
                        <p className="drop-shadow-md text-[23px] font-Poppins font-black">Colored</p>
                    </Button>
                </div>
            </div>
        </div>

        <div className="h-screen w-full bg-[#E9E0FF] flex flex-col items-center justify-start">
            <p className="mt-20 font-Loubag text-[30px] text-black">Choose your phone model</p>
            <div className="h-[22rem] mt-24 flex flex-row items-center justify-center w-[63rem]">
                <div className="h-full flex flex-col items-center justify-center">
                    <Image 
                        src="/assets/images/transparent-case.png"
                        alt="transparent case"
                        width={170}
                        height={170}
                        className="mb-5 mx-6"
                    />
                    <p className="text-xl text-black font-Poppins font-semibold">Transparent</p>
                </div> 

                <div className="h-full flex flex-col items-start justify-start mx-4">
                    <p className="text-lg font-Poppins font-bold my-3">APPLE</p>
                    <p className="text-md font-Poppins">iPhone 15 Pro</p>
                    <p className="text-md font-Poppins">iPhone 15</p>
                </div>
                <div className="h-full flex flex-col items-start justify-start mx-4">
                    <p className="text-lg font-Poppins font-bold my-3">SAMSUNG</p>
                    <p className="text-md font-Poppins">Galaxy S24 Ultra</p>
                    <p className="text-md font-Poppins">Galaxy S24</p>
                </div>
                <div className="h-full flex flex-col items-start justify-start mx-4">
                    <p className="text-lg font-Poppins font-bold my-3">XIAOMI</p>
                    <p className="text-mdfont-Poppins">Xiaomi Mi 14 Pro</p>
                    <p className="text-md font-Poppins">Xiaomi Mi 14</p>
                </div>
                <div className="h-full flex flex-col items-start justify-start mx-4">
                    <p className="text-lg font-Poppins font-bold my-3">HUAWEI</p>
                    <p className="text-md font-Poppins">Huawei 60 Pro</p>
                    <p className="text-md font-Poppins">Huawei 60</p>
                </div>
            </div>
            <Button variant="gradient" size='xl' radius='xl' gradient={{from: '#FFC3FE', to: '#B5F5FC', deg: 90}}  
                styles={{
                    root: {
                        filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
                    }
                }}
            >
                <p className="drop-shadow-md text-[28px] font-Poppins font-black">Design Your Case</p>
            </Button>
        </div>
    </div>
    )
}