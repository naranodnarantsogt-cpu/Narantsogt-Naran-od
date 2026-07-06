import React, { useState, useEffect } from "react";
import { SinglePlayer } from "./components/SinglePlayer";
import { Multiplayer } from "./components/Multiplayer";
import { Leaderboard } from "./components/Leaderboard";
import { TournamentInfo } from "./components/TournamentInfo";
import { Keyboard, Users, Trophy, Clock, ExternalLink, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

type TabType = "single" | "multi" | "leaderboard" | "tournament";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [stars, setStars] = useState<number>(() => {
    return parseInt(localStorage.getItem("typeracer_stars") || "0", 10);
  });

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          // If anonymous sign-in is disabled or restricted in the Firebase console,
          // log it as an expected warning rather than a fatal console.error.
          // The application runs perfectly in guest/unauthenticated mode.
          console.log("Firebase anonymous auth is disabled/restricted. Running app in guest mode:", error.message || error);
        });
      } else {
        console.log("Logged in anonymously as:", user.uid);
      }
    });

    const handleStarsUpdated = () => {
      setStars(parseInt(localStorage.getItem("typeracer_stars") || "0", 10));
    };
    window.addEventListener("typeracer_stars_updated", handleStarsUpdated);
    return () => {
      window.removeEventListener("typeracer_stars_updated", handleStarsUpdated);
    };
  }, []);

  // Specified Vercel link that should open in a new tab when clicking the "⌨️ Typeracer" portfolio tab
  const PORTFOLIO_VERCEL_URL = "https://typeracer-mongolian.vercel.app";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      {/* Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <span className="text-xl">⌨️</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
                  TYPERACER MONGOLIA
                </h1>
                {stars > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={stars}
                    className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-black"
                  >
                    <span>⭐</span>
                    <span>{stars}</span>
                  </motion.div>
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Бичих хурдны аварга шалгаруулах талбар
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center flex-wrap gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            {/* Single player tab */}
            <button
              onClick={() => setActiveTab("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "single"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Ганцаарчилсан
            </button>

            {/* Multiplayer tab */}
            <button
              onClick={() => setActiveTab("multi")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "multi"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Олон тоглогч
            </button>

            {/* Leaderboard tab */}
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "leaderboard"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Шилдгүүд
            </button>

            {/* Tournament rules tab */}
            <button
              onClick={() => setActiveTab("tournament")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "tournament"
                  ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Тэмцээн
            </button>

            {/* Portfolio Tab linking to Vercel (opens in new tab) */}
            <a
              href={PORTFOLIO_VERCEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent transition-all"
            >
              <span>⌨️ Typeracer</span>
              <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === "single" && <SinglePlayer />}
            {activeTab === "multi" && <Multiplayer />}
            {activeTab === "leaderboard" && <Leaderboard />}
            {activeTab === "tournament" && <TournamentInfo />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Details */}
      <footer className="border-t border-slate-900/60 py-6 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-mono">
          <div>
            &copy; 2026 Typeracer Mongolia. Бүх эрх хамгаалагдсан.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firestore Real-time Синхрончлол Идэвхтэй
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
