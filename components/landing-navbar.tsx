'use client'

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { HiOutlineShoppingCart } from "react-icons/hi";
import Link from "next/link";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

function LandingNavbar() {

    


    const { session } = useSessionContext();
    const initialIsOpen = false;
    const [isOpen, setIsOpen] = useState(false);
    const user = session?.user;
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = window.location.origin;
    };

    // Ensure user exists in users table
    useEffect(() => {
      const ensureUser = async () => {
        if (user) {
          const { id, email } = user;
          const { data: existing } = await supabase
            .from('user')
            .select('id')
            .eq('id', id)
            .single();
          if (!existing) {
            await supabase.from('user').insert({ id, email });
          }
        }
      };
      ensureUser();
    }, [user, supabase]);


    return (
        <div className="absolute flex flex-row justify-between items-center w-full mt-8 py-6 px-8 h-10 md:px-10 mb-4">
            <button onClick={() => router.push('/')} className="focus:outline-none" aria-label="Go to home">
                <Image 
                    src="/assets/images/logo-gradient.png" 
                    alt="alt" 
                    width={800} 
                    height={800}
                    className="md:w-10 md:h-10 w-10 h-10"
                />
            </button>
            
            {/* <div className="md:hidden">
                <button>
                <Image src="/assets/images/burger-menu.svg" alt="alt" width={30} height={30} />
                </button>
            </div> */}

            <div className='z-20'>
                {session ? (
                <div className="flex flex-row items-center gap-4">
                   {/* Cart Icon */}
                   <button
                     onClick={() => router.push('/cart')}
                     className="focus:outline-none"
                     aria-label="Go to cart"
                   >
                     {/* Simple SVG cart icon */}
                     <HiOutlineShoppingCart className="w-7 h-7 text-purple-600 hover:text-purple-800" />
                   </button>
                    
                    <div className="relative">
                      <button 
                      onClick={() => setIsOpen((prev) => !prev)}
                      className='flex flex-row items-center gap-2'
                      >
                      <div className='w-12 h-12 rounded-full overflow-hidden border border-gray-300 bg-purple flex items-center justify-center'>
                        <span className='text-xl font-bold text-white'>
                          {user?.email?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <p className='hidden md:block'>{user?.email}</p>
                      </button>
                
                      {isOpen && (
                      <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20'>
                          <button 
                              onClick={handleSignOut}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                              Sign Out
                          </button>
                      </div>
                      )}
                    </div>
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
