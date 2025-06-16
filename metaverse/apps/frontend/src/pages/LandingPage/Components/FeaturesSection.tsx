
import React from "react";
import { User, Users, Monitor, ArrowRight, Sparkles } from "lucide-react";

// Enhanced neon pixel background for icons
const NeonPixel: React.FC<{ color?: string }> = ({ color = "#21d4fd" }) => (
  <span
    className="inline-block mr-3 align-middle animate-float"
    style={{
      width: 32,
      height: 32,
      background: `linear-gradient(135deg, ${color}, ${color}90)`,
      borderRadius: "8px",
      boxShadow: `0 0 12px 2px ${color}, 0 0 24px ${color}60`,
      marginRight: "0.75rem",
      verticalAlign: "middle",
      outline: "2px solid #0B1026",
      outlineOffset: "-2px",
      display: "inline-block",
    }}
  />
);

// Enhanced feature items
const features = [
  {
    title: "Real-time Avatars",
    desc: "Express yourself and see friends move in real time, with playful pixel-style characters that respond to your every action!",
    icon: <User className="w-7 h-7 text-neon-blue" />,
    color: "#21d4fd",
  },
  {
    title: "Private Zones",
    desc: "Step into your own room or secret space. Invite only the people you want near you and create unforgettable memories.",
    icon: <NeonPixel color="#39ff14" />,
    color: "#39ff14",
  },
  {
    title: "Interactive Monitors",
    desc: "Watch, chat, or collaborate on digital content from lively pixel monitors embedded throughout the metaverse world.",
    icon: <Monitor className="w-7 h-7 text-neon-violet" />,
    color: "#a259ff",
  },
  {
    title: "Smooth Multiplayer",
    desc: "Lightning-fast connections with buttery-smooth pixel movement. Experience seamless interaction like never before.",
    icon: <Users className="w-7 h-7 text-neon-pink" />,
    color: "#ff65c3",
  },
];

const FeaturesSection: React.FC = () => (
  <section id="features" className="w-full max-w-6xl mx-auto py-28 px-6">
    <div className="text-center mb-16">
      <h2 className="font-pixel text-3xl md:text-4xl lg:text-5xl text-neon-violet mb-4 
      drop-shadow-[0_0_12px_#a259ffc0] animate-float">
        Metaverse Features
      </h2>
      <div className="flex items-center justify-center gap-2 mb-8">
        <Sparkles className="w-6 h-6 text-neon-green animate-star-twinkle" />
        <p className="text-white/70 text-lg font-inter">Experience the future of social interaction</p>
        <Sparkles className="w-6 h-6 text-neon-pink animate-star-twinkle" style={{animationDelay: '0.5s'}} />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {features.map((f, i) => (
        <div
          key={f.title}
          className="group relative bg-metaverse-card border border-metaverse-bg/60 rounded-3xl p-8 flex items-start gap-6 
          shadow-xl transition-all duration-300 hover:shadow-neon-blue hover:scale-105 hover:border-neon-blue/50
          before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br 
          before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
          style={{animationDelay: `${i * 0.2}s`}}
        >
          <div className="flex-shrink-0">
            <span 
              style={{boxShadow:`0 0 12px 2px ${f.color}, 0 0 24px ${f.color}60`}} 
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-metaverse-bg 
              ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
            >
              {f.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-pixel text-xl text-neon-green drop-shadow-[0_0_8px_#39ff14a0] mb-3">
              {f.title}
            </h3>
            <p className="text-white/90 font-inter text-base leading-relaxed">{f.desc}</p>
          </div>
          {/* Enhanced neon arrow on hover */}
          <ArrowRight className="absolute right-8 bottom-8 w-6 h-6 text-neon-violet opacity-0 
          group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
        </div>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
