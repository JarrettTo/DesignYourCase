import Image from "next/image";

import LandingNavbar from "@/components/landing-navbar";
import Hero from "@/components/hero";
import Heading from "@/components/heading"
import Promo from "@/components/promo"

export default function Home() {
  return (
    <main className="flex flex-col w-full">
        <LandingNavbar />
        <Hero />
        <Heading />
        <Promo />
    </main>
  );
}
