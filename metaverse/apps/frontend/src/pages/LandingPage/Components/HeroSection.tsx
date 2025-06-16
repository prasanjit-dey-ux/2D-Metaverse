
import React from "react";

const HeroSection: React.FC = () => (
  <section className="w-full py-24 flex flex-col items-center justify-center text-center relative">
    <h1
      className="font-extrabold text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-tight 
      drop-shadow-[0_4px_32px_#21d4fd80] mb-10"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      Step Into Your Own
      <br />
      <span
        className="font-pixel text-neon-green tracking-tight drop-shadow-[0_0_16px_#39ff14] 
        animate-float"
        style={{ fontSize: "4rem", letterSpacing: "-3px" }}
      >
        2D Metaverse
      </span>
    </h1>
    <p className="max-w-2xl mx-auto text-lg md:text-xl lg:text-2xl text-white/85 mb-12 leading-relaxed">
      A borderless pixel world for exploring, learning, and hanging out—just one click away. 
      <br />
      <span className="font-pixel text-neon-violet text-base">No VR goggles needed.</span>
    </p>

    <div className="mb-16">
      <a
        href="/signin"
        className="font-pixel text-neon-blue text-lg px-12 py-4 bg-metaverse-card rounded-full 
        shadow-neon-blue border-3 border-neon-blue hover:text-neon-green hover:shadow-neon-green 
        hover:border-neon-green transition-all animate-float hover:scale-110"
        style={{
          boxShadow: "0 0 0 4px #21d4fd, 0 0 24px #21d4fd80, 0 0 48px #21d4fd40",
          textShadow: "0 0 3px #21d4fd, 0 0 12px #21d4fd90",
        }}
      >
        Get Started Now
      </a>
    </div>
    <div className="w-full flex flex-col items-center justify-center">
    </div>
  </section>
);

export default HeroSection;
