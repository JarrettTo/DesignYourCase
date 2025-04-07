'use client'

import React, { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

function LandingNavbar() {




    const { data: session, status } = useSession();
    const initialIsOpen = false;
    const [isOpen, setIsOpen] = useState(status === "loading" ? false : initialIsOpen);
    const user = session?.user;

    const handleSignOut = () => {
        signOut().then(() => {
            window.location.href = window.location.origin;
        }).catch(error => {
            console.error('Error signing out', error);
        });
    };


    return (
        <div className="absolute flex flex-row justify-between items-center w-full mt-5 py-6 px-8 h-10 md:px-10">
            <Image
                src="/assets/images/logo-gradient.png"
                alt="alt"
                width={1000}
                height={1000}
                className="md:w-20 md:h-20"
            />

            {/* <div className="md:hidden">
                <button>
                <Image src="/assets/images/burger-menu.svg" alt="alt" width={30} height={30} />
                </button>
            </div> */}

            <div className='z-20'>
                {session ? (
                    <div>
                        <div className='flex flex-row items-center gap-2'>
                            <button
                                onClick={() => setIsOpen((prev) => !prev)}
                                className='flex flex-row items-center gap-2'
                            >
                                <div className='w-12 h-12 rounded-full overflow-hidden border border-gray-300'>
                                    <img
                                        src={user?.image || '/path/to/default-image.jpg'}
                                        alt='user'
                                        width={70}
                                        height={70}
                                    />
                                </div>
                                <p className=''>{user?.name}</p>
                            </button>
                            <a href="/user-dashboard">
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0,0,256,256">
                                    <g fill="#addaea" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none"><g transform="scale(5.12,5.12)"><path d="M25,1.05078c-0.2175,0 -0.43414,0.06898 -0.61914,0.20898l-23,17.95117c-0.43,0.34 -0.50992,0.9682 -0.16992,1.4082c0.34,0.43 0.9682,0.50992 1.4082,0.16992l1.38086,-1.07812v26.28906c0,0.55 0.45,1 1,1h14v-18h12v18h14c0.55,0 1,-0.45 1,-1v-26.28906l1.38086,1.07812c0.19,0.14 0.39914,0.21094 0.61914,0.21094c0.3,0 0.58906,-0.13086 0.78906,-0.38086c0.34,-0.44 0.26008,-1.0682 -0.16992,-1.4082l-23,-17.95117c-0.185,-0.14 -0.40164,-0.20898 -0.61914,-0.20898zM35,5v1.05078l6,4.67969v-5.73047z"></path></g></g>
                                </svg>
                            </a>
                        </div>
                        {isOpen && (
                            <div className='absolute flex flex-col justify-center w-48 mt-4 z-20'>
                                <button onClick={handleSignOut}>Sign Out</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link href="/auth/sign-in" className="">
                        Sign In
                    </Link>
                )}
            </div>
        </div>
    );
}

export default LandingNavbar;
