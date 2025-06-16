
import React from "react";

// Simple animated starfield + floating particles for metaverse effect
const STAR_COUNT = 40;
const PARTICLE_COUNT = 20;

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const AnimatedBackground: React.FC = () => {
  // We'll use fixed positions, randomized (recomputed on reloads)
  const stars = React.useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        key: `star-${i}`,
        top: `${getRandom(5, 95)}%`,
        left: `${getRandom(0, 100)}%`,
        size: getRandom(2, 4),
        delay: `${getRandom(0, 2)}s`,
      })),
    []
  );

  const particles = React.useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        key: `particle-${i}`,
        top: `${getRandom(10, 90)}%`,
        left: `${getRandom(0, 100)}%`,
        size: getRandom(8, 16),
        colorClass: i % 4 === 0 ? "bg-neon-pink" : i % 4 === 1 ? "bg-neon-green" : i % 4 === 2 ? "bg-neon-blue" : "bg-neon-violet",
        delay: `${getRandom(0, 4)}s`,
        duration: `${getRandom(5, 12)}s`,
      })),
    []
  );

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden"
    >
      {/* Twinkling Stars */}
      {stars.map((star) => (
        <div
          key={star.key}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
          className="absolute rounded-full bg-white opacity-70 blur-[1px] animate-star-twinkle"
        />
      ))}
      {/* Floating Neon Particles */}
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
          className={`absolute rounded-full opacity-70 blur-[1.5px] animate-float mix-blend-screen ${p.colorClass}`}
        />
      ))}
      {/* Soft vignette for immersion */}
      <div className="absolute inset-0 bg-gradient-to-b from-metaverse-bg/70 via-metaverse-bg/80 to-black/90 pointer-events-none" />
    </div>
  );
};

export default AnimatedBackground;
