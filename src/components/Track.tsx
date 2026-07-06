import React from "react";
import { VehicleType, PlayerState } from "../types";
import { Flag, Trophy } from "lucide-react";
import { motion } from "motion/react";

interface TrackProps {
  players: PlayerState[];
  currentPlayerId?: string;
}

export function Track({ players, currentPlayerId }: TrackProps) {
  const getVehicleEmoji = (type: VehicleType) => {
    switch (type) {
      case "slow":
        return "🐢";
      case "fast":
        return "🚗";
      case "fastest":
        return "🚀";
      default:
        return "🐢";
    }
  };

  const getVehicleName = (type: VehicleType) => {
    switch (type) {
      case "slow":
        return "Удаан (Амархан)";
      case "fast":
        return "Хурдан (Дундаж)";
      case "fastest":
        return "Маш хурдан (Хэцүү)";
      default:
        return "";
    }
  };

  return (
    <div id="game-track" className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden">
      {/* Track Background Ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 opacity-30" />

      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
        <span className="text-xs font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          УРАЛДААНЫ ЗАМ
        </span>
        <div className="flex gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1"><span className="text-emerald-400">🏁</span> Бариа</span>
        </div>
      </div>

      <div className="space-y-6 relative py-2">
        {players.map((player) => {
          const isMe = player.id === currentPlayerId;
          const progress = Math.min(100, Math.max(0, player.progress));

          return (
            <div key={player.id} className="relative group">
              {/* Lane Info Label */}
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className={`font-medium flex items-center gap-1.5 ${isMe ? "text-cyan-400 font-bold" : "text-slate-300"}`}>
                  {isMe ? "Надад (" + player.name + ")" : player.name}
                  {isMe && (
                    <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/20">
                      Би
                    </span>
                  )}
                  {player.isFinished && (
                    <span className="bg-emerald-500/15 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5 font-bold">
                      <Trophy className="w-2.5 h-2.5" /> Барианд орсон!
                    </span>
                  )}
                </span>
                <span className="font-mono text-slate-400 flex items-center gap-2">
                  <span>{Math.round(progress)}%</span>
                  {player.wpm > 0 && <span className="text-slate-500">|</span>}
                  {player.wpm > 0 && <span className="text-amber-400 font-semibold">{player.wpm} WPM</span>}
                </span>
              </div>

              {/* Lane Road */}
              <div className="h-10 bg-slate-950/80 rounded-lg relative flex items-center px-4 overflow-hidden border border-slate-800 group-hover:border-slate-700/80 transition-colors">
                {/* Lane markings */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] border-t border-dashed border-slate-800" />

                {/* Starting Grid */}
                <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-slate-800" />

                {/* Finish Line Checkers */}
                <div className="absolute right-12 top-0 bottom-0 w-3 flex flex-col justify-between opacity-45 bg-slate-800">
                  <div className="h-1 w-full bg-slate-300" />
                  <div className="h-1 w-full bg-slate-900" />
                  <div className="h-1 w-full bg-slate-300" />
                  <div className="h-1 w-full bg-slate-900" />
                  <div className="h-1 w-full bg-slate-300" />
                  <div className="h-1 w-full bg-slate-900" />
                  <div className="h-1 w-full bg-slate-300" />
                  <div className="h-1 w-full bg-slate-900" />
                </div>

                {/* Animated Vehicle */}
                <motion.div
                  className="absolute z-10 text-2xl flex items-center justify-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                  style={{ left: `calc(${progress}% * 0.82 + 8px)` }}
                  animate={{
                    y: player.isFinished ? [0, -4, 0] : [0, -1, 1, 0],
                  }}
                  transition={{
                    y: {
                      repeat: Infinity,
                      duration: player.isFinished ? 0.4 : 1.2,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <span className="relative">
                    {getVehicleEmoji(player.vehicle)}
                    {isMe && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                    )}
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
