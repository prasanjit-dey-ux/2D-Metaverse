
import React from "react";
import { User, Users } from "lucide-react";

const socials = [
  { name: "GitHub", url: "https://github.com/prasanjit-dey-ux", icon: <User className="w-4 h-4" /> },
  { name: "Discord", url: "#", icon: <Users className="w-4 h-4" /> },
];

const Footer: React.FC = () => (
  <footer className="w-full py-8 bg-metaverse-bg/90 border-t border-metaverse-bg/70 text-center flex flex-col md:flex-row items-center justify-between px-8 gap-6">
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-5">
      <span className="font-pixel text-neon-green text-sm tracking-tighter">PixelVerse</span>
      <span className="text-xs text-white/40">© {new Date().getFullYear()} All rights reserved.</span>
    </div>
    <div className="flex items-center gap-5">
      <a href="#features" className="font-pixel text-neon-violet text-xs hover:text-neon-green transition">Features</a>
      <a href="#about" className="font-pixel text-neon-violet text-xs hover:text-neon-green transition">About</a>
      <a href="/terms" className="font-pixel text-neon-violet text-xs hover:text-neon-green transition">Terms</a>
      {socials.map((s) => (
        <a
          key={s.name}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-neon-green/10 transition-all ml-2"
        >
          {s.icon}
        </a>
      ))}
    </div>
  </footer>
);

export default Footer;
