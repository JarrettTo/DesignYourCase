import LandingNavbar from "@/components/landing-navbar";
import Hero from "@/components/hero";
import Heading from "@/components/heading"
import Promo from "@/components/promo"
import Order from "@/components/order"
import Steps from "@/components/steps"
import Footer from "@/components/footer"

export default function Home() {

  return (
       <main className="flex flex-col w-full overflow-x-hidden">
          <Hero />
          <Heading />
          <Promo />
          <Order/>
          <Steps/>
          <Footer />
      </main>
  );
}
