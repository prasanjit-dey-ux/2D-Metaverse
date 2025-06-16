
import React from "react";
import { NavLink } from "react-router-dom";
import { User, Sparkles } from "lucide-react";

const navLinks = [
  { label: "Explore", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Sign In", href: "/signin" },
];

const LandingHeader: React.FC = () => (
  <header className="w-full z-20 relative">
    <nav
      className="max-w-[1400px] mx-auto flex items-center justify-between px-10 py-5
      bg-metaverse-card/70 backdrop-blur-lg rounded-3xl mt-8 shadow-2xl border border-metaverse-bg/60
      hover:border-neon-blue/40 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        {/* Enhanced pixel-style logo - removed animate-float */}
        <div
          className="w-12 h-12 bg-neon-green rounded-xl flex items-center justify-center shadow-neon-green
          hover:shadow-neon-violet hover:bg-neon-violet transition-all duration-300"
          style={{ boxShadow: "0 0 12px #39ff14, 0 0 32px #39ff1460" }}
        >
          <span
            className="font-pixel text-xl tracking-tighter text-metaverse-bg"
            style={{ textShadow: "0 0 3px #fff" }}
          >
            M2
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-lg text-neon-green drop-shadow-[0_0_4px_#39ff14]" 
          style={{letterSpacing: "-0.8px"}}>PixelVerse</span>
          <Sparkles className="w-5 h-5 text-neon-pink animate-star-twinkle" />
        </div>
      </div>
      <ul className="flex items-center space-x-10 font-inter text-white text-lg font-medium">
        {navLinks.map((link) =>
          link.label === "Sign In" ? (
            <li key={link.label}>
              <NavLink
                to={link.href}
                className="inline-flex items-center px-6 py-2.5 rounded-xl font-pixel text-sm 
                bg-neon-violet text-white shadow-neon-violet border-2 border-transparent 
                hover:bg-neon-green hover:text-metaverse-bg hover:shadow-neon-green hover:scale-105
                transition-all duration-300"
                style={{ boxShadow: "0 0 8px #a259ff, 0 0 24px #a259ff60" }}
              >
                <User className="w-5 h-5 mr-2" /> {link.label}
              </NavLink>
            </li>
          ) : (
            <li key={link.label}>
              <a
                href={link.href}
                className="relative font-pixel text-base tracking-tighter text-neon-green px-4 py-2
                  after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-1 after:bottom-0 after:left-0 
                  after:bg-neon-violet after:origin-bottom-right after:transition-transform after:duration-300 
                  hover:after:scale-x-100 hover:after:origin-bottom-left hover:text-neon-violet hover:scale-105
                  transition-all duration-300"
                style={{
                  textShadow: "0 0 1px #fff, 0 0 6px #39ff14a0",
                  letterSpacing: "-0.8px",
                }}
              >
                {link.label}
              </a>
            </li>
          )
        )}
      </ul>
    </nav>
  </header>
);

export default LandingHeader;
