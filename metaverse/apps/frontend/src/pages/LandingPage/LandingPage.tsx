import AnimatedBackground from "./Components/AnimatedBackground";
import LandingHeader from "./Components/LandingHeader";
import HeroSection from "./Components/HeroSection";
import FeaturesSection from "./Components/FeaturesSection";
import TestimonialsSection from "./Components/TestimonialsSection";
import Footer from "./Components/Footer"

const LandingPage = () => {
  return (
    <main className="relative min-h-screen bg-[var(--metaverse-bg)] text-white font-inter overflow-x-hidden flex flex-col">

      {/* Animated Background for immersion */}
      <AnimatedBackground />
      {/* Header */}
      <LandingHeader />
      {/* Hero */}
      <HeroSection />
      {/* Features */}
      <FeaturesSection />
      {/* Testimonials */}
      <TestimonialsSection />
      {/* Footer */}
      <Footer />
    </main>
  );
};

export default LandingPage;
