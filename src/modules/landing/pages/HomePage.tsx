import { useEffect } from "react";
import { useLocation } from "react-router";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/sections/Hero";
import SocialProof from "../components/sections/SocialProof";
import Problem from "../components/sections/Problem";
import Solution from "../components/sections/Solution";
import Features from "../components/sections/Features";
import ProductShowcase from "../components/sections/ProductShowcase";
import Pricing from "../components/sections/Pricing";
import OpenSource from "../components/sections/OpenSource";
import FAQ from "../components/sections/FAQ";
import CTAFooter from "../components/sections/CTAFooter";
import Footer from "../components/layout/Footer";

export default function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 0);
      }
    }
  }, [hash]);
  return (
    <div className="min-h-dvh bg-page">
      <Navbar />
      <Hero />
      <SocialProof />
      <Problem />
      <Solution />
      <Features />
      <ProductShowcase />
      <Pricing />
      <OpenSource />
      <FAQ />
      <CTAFooter />
      <Footer />
    </div>
  );
}
