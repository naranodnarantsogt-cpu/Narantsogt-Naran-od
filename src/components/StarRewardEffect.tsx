import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playStarSound } from "../utils/audio";

interface StarRewardEffectProps {
  difficulty: "slow" | "fast" | "fastest";
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
}

export function StarRewardEffect({ difficulty, onComplete }: StarRewardEffectProps) {
  const [starsShown, setStarsShown] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showText, setShowText] = useState(false);

  // Map difficulty to star count
  const starCount = difficulty === "slow" ? 1 : difficulty === "fast" ? 2 : 4;

  useEffect(() => {
    // Generate particle positions for a beautiful Geometry Dash style burst
    const newParticles: Particle[] = [];
    const colors = ["#fbbf24", "#f59e0b", "#fef08a", "#ffffff", "#f43f5e"];
    
    // Create 30 explosion particles
    for (let i = 0; i < 35; i++) {
      const angle = (i * (360 / 35) * Math.PI) / 180 + (Math.random() - 0.5) * 0.2;
      const distance = 80 + Math.random() * 140;
      newParticles.push({
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0.4 + Math.random() * 0.8,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(newParticles);

    // Staggered star animation to match Geometry Dash style count-up
    let current = 0;
    const interval = setInterval(() => {
      if (current < starCount) {
        current += 1;
        setStarsShown(current);
        playStarSound();
      } else {
        clearInterval(interval);
        setShowText(true);
        
        // Save stars to local storage
        const existingStars = parseInt(localStorage.getItem("typeracer_stars") || "0", 10);
        localStorage.setItem("typeracer_stars", (existingStars + starCount).toString());
        
        // Dispatch a custom event to notify App.tsx to update any header counters
        window.dispatchEvent(new Event("typeracer_stars_updated"));
      }
    }, 280);

    return () => clearInterval(interval);
  }, [starCount]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none overflow-hidden">
      {/* Background radial flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0.1] }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 bg-radial from-amber-500/30 to-transparent pointer-events-none"
      />

      {/* Main Container */}
      <div className="relative flex flex-col items-center justify-center p-8 max-w-md w-full text-center">
        {/* Glowing aura background behind stars */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/5 to-amber-600/20 blur-3xl"
        />

        {/* Geometry Dash style expanding shockwave ring */}
        <motion.div
          initial={{ scale: 0.1, opacity: 1, border: "4px solid #f59e0b" }}
          animate={{ scale: 2.5, opacity: 0, borderWidth: "1px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute w-40 h-40 rounded-full pointer-events-none"
        />

        {/* Explosive Star Particles */}
        {starsShown > 0 &&
          particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: p.scale, opacity: [1, 1, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute pointer-events-none text-2xl font-bold"
              style={{ color: p.color }}
            >
              ⭐
            </motion.div>
          ))}

        {/* Star Container */}
        <div className="flex justify-center items-center gap-4 min-h-[140px] mb-6 relative">
          <AnimatePresence>
            {Array.from({ length: starCount }).map((_, index) => {
              const isVisible = index < starsShown;
              if (!isVisible) return null;

              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 15,
                    duration: 0.4,
                  }}
                  className="relative drop-shadow-[0_10px_25px_rgba(245,158,11,0.5)] cursor-pointer"
                >
                  {/* Individual star glowing shadow back-layer */}
                  <div className="absolute inset-0 bg-amber-400 blur-md rounded-full opacity-60 scale-75" />
                  
                  {/* High Quality Geometry Dash Style SVG Star */}
                  <svg
                    className="w-16 h-16 text-amber-400 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.786 1.4 8.168L12 18.896l-7.334 3.856 1.4-8.168L.132 9.209l8.2-1.191L12 .587z" />
                  </svg>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Reward texts */}
        <div className="space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-amber-500 font-bold block mb-1">
              {difficulty === "slow" ? "EASY LEVEL" : difficulty === "fast" ? "NORMAL LEVEL" : "DEMON LEVEL"}
            </span>
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              УРАЛДААН ДУУСЛАА!
            </h2>
          </motion.div>

          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 1.25, 1], opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center justify-center space-y-1.5"
              >
                {/* Large geometry dash style award text */}
                <div className="px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-2xl font-mono tracking-widest drop-shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2">
                  <span>+ {starCount}</span>
                  <span className="animate-pulse">⭐</span>
                  <span>ОНОО</span>
                </div>
                <p className="text-slate-400 text-xs font-medium max-w-xs">
                  {difficulty === "slow" 
                    ? "Амархан түвшинг амжилттай дуусгаж 1 од авлаа!" 
                    : difficulty === "fast" 
                    ? "Дундаж түвшинг амжилттай дуусгаж 2 од авлаа!" 
                    : "Хэцүү түвшинг амжилттай дуусгаж 4 од авлаа! Гайхалтай!"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onComplete}
          className="mt-8 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform active:scale-95 transition-all cursor-pointer border border-amber-300/30"
        >
          ҮРГҮЛЖЛҮҮЛЭХ
        </motion.button>
      </div>
    </div>
  );
}
