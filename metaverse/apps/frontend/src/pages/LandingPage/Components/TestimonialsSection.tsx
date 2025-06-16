import React from "react";

const npcAvatars = [
  <svg width="40" height="40" viewBox="0 0 24 24">
    <rect width="24" height="24" rx="4" fill="#a259ff" />
    <rect x="16" y="6" width="3" height="10" fill="#fff" />
    <rect x="5" y="6" width="3" height="10" fill="#fff" />
    <rect x="10" y="16" width="4" height="2" fill="#fff" />
  </svg>,
  <svg width="40" height="40" viewBox="0 0 24 24">
    <rect width="24" height="24" rx="4" fill="#39ff14" />
    <rect x="8" y="10" width="8" height="8" fill="#222" />
    <rect x="6" y="6" width="3" height="3" fill="#fff" />
    <rect x="15" y="6" width="3" height="3" fill="#fff" />
  </svg>,
  <svg width="40" height="40" viewBox="0 0 24 24">
    <rect width="24" height="24" rx="4" fill="#21d4fd" />
    <rect x="5" y="8" width="8" height="8" fill="#fff" />
    <rect x="16" y="10" width="2" height="4" fill="#222" />
  </svg>,
  <svg width="40" height="40" viewBox="0 0 24 24">
    <rect width="24" height="24" rx="4" fill="#ff65c3" />
    <rect x="7" y="4" width="10" height="14" fill="#120e30" />
    <rect x="9" y="8" width="2" height="2" fill="#fff" />
    <rect x="13" y="8" width="2" height="2" fill="#fff" />
  </svg>,
];

const testimonials = [
  {
    name: "Prasanjit Dey",
    text: "I threw a party virtual style! Dancing pixels everywhere. The interactive monitors made it epic. Love the secret rooms! 🎉",
    avatar: npcAvatars[1],
    
  },
  {
    name: "Rajarshi Tambuli",
    text: "Brings back the best vibes from my childhood arcades. Now my class can pixel-hangout together and learn in a fun way!",
    avatar: npcAvatars[0],
   
  },
  {
    name: "Aarya Deep Jaiswal",
    text: "Multiplayer is smooth like butter. I just unlocked a new hairstyle for my pixel self and the customization is incredible! 😎",
    avatar: npcAvatars[2],
    
  },
  {
    name: "Suman Kumar",
    text: "The monitors let us watch streams and code side-by-side. Never felt this close online before! The future is here.",
    avatar: npcAvatars[3],
    
  },
];

const TestimonialsSection: React.FC = () => (
  <section id="testimonials" className="w-full max-w-7xl mx-auto py-28 px-6 relative">
    <div className="text-center mb-16">
      <h2 className="font-pixel text-3xl md:text-4xl lg:text-5xl text-neon-green mb-6 
      drop-shadow-[0_0_12px_#39ff14a0]">
        Contributors
      </h2>
      <p className="text-white/70 text-lg font-inter">Join thousands of happy pixel explorers</p>
    </div>
    
    <div className="flex flex-wrap gap-y-10 gap-x-8 justify-center">
      {testimonials.map((t, idx) => (
        <div
          key={t.name}
          className={`relative max-w-sm bg-metaverse-card rounded-3xl px-8 py-7
            border border-neon-blue/50 shadow-neon-blue mb-8 hover:scale-105 transition-all duration-300
            before:absolute before:w-6 before:h-6 before:rounded-br-2xl before:bg-metaverse-card 
            before:top-full before:left-12 before:border-b before:border-r before:border-neon-blue/60
           hover:shadow-neon-green hover:border-neon-green/50`}
          style={{ animationDelay: `${idx * 0.3}s` }}
        >
          <div className="flex items-center mb-6">
            <span className="mr-4 scale-110 drop-shadow-lg">{t.avatar}</span>
            <div className="flex-1">
              <span className="font-pixel text-base text-neon-violet block">{t.name}</span>
              <div className="font-inter text-sm text-white/60 mb-2">{t.role}</div>
            </div>
          </div>
          <div className="text-white text-base font-inter leading-relaxed">
            <span className="inline-block leading-snug">"{t.text}"</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default TestimonialsSection;
