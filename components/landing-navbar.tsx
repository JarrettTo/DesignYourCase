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
