import React, { useEffect, useState } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { ScoreEntry } from "../types";
import { Trophy, Medal, Zap, Calendar, Award } from "lucide-react";
import { motion } from "motion/react";

export function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");

  useEffect(() => {
    const scoresRef = collection(db, "typeracer_scores");
    // Fetch top 150 scores to allow robust, zero-latency client-side filtering without requiring new Firestore indexes
    const q = query(scoresRef, orderBy("wpm", "desc"), orderBy("timestamp", "asc"), limit(150));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedScores: ScoreEntry[] = [];
        snapshot.forEach((doc) => {
          fetchedScores.push({ id: doc.id, ...doc.data() } as ScoreEntry);
        });
        setScores(fetchedScores);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading scores:", error);
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, "typeracer_scores");
        } catch (e) {
          // Keep normal react state error logging
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("mn-MN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <span className="text-2xl">🥇</span>;
      case 1:
        return <span className="text-2xl">🥈</span>;
      case 2:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold">{index + 1}</span>;
    }
  };

  // Filter scores in-memory
  const filteredScores = scores.filter((score) => {
    if (selectedDifficulty === "all") return true;
    return score.difficulty === selectedDifficulty;
  });

  // Take the top 10 for the filtered view
  const topFilteredScores = filteredScores.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header section with Stats or Tournament Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent rounded-2xl p-6 border border-amber-500/20 relative overflow-hidden">
        <div className="absolute right-6 top-6 opacity-10">
          <Trophy className="w-32 h-32 text-amber-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
              ТОП ТЭРГҮҮН ТОГЛОГЧИД
            </h3>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Хамгийн өндөр WPM (минутад бичсэн үгийн тоо) үзүүлэлттэй шилдэг бичээчдийн жагсаалт. Түвшин бүрээр шүүж сонирхоорой!
            </p>
          </div>
          <div className="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-xl border border-amber-500/20 text-xs font-mono">
            ⏱ Хурдаа сорьж, өрсөлд!
          </div>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800/80 max-w-2xl">
        {[
          { id: "all", label: "Бүх түвшин", icon: "🌐" },
          { id: "easy", label: "Амархан (1 өгүүлбэр)", icon: "🐢" },
          { id: "medium", label: "Дундаж (2 өгүүлбэр)", icon: "🚗" },
          { id: "hard", label: "Хэцүү (4 өгүүлбэр)", icon: "🚀" }
        ].map((tab) => {
          const isActive = selectedDifficulty === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedDifficulty(tab.id as any)}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all transform active:scale-95 cursor-pointer border ${
                isActive
                  ? "bg-slate-800 border-slate-700 shadow-inner text-white ring-1 ring-amber-500/30"
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && filteredScores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          {/* 2nd Place */}
          {filteredScores[1] ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              key={`2nd-${selectedDifficulty}-${filteredScores[1].id}`}
              className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 text-center relative overflow-hidden order-2 md:order-1 flex flex-col justify-between"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-slate-400" />
              <div>
                <div className="text-3xl mb-1">🥈</div>
                <h4 className="font-bold text-slate-200 line-clamp-1">{filteredScores[1].name}</h4>
                <div className="text-slate-400 text-xs mt-0.5 font-mono">{formatDate(filteredScores[1].timestamp)}</div>
              </div>
              <div className="mt-4 bg-slate-950/60 rounded-xl py-2 px-3 inline-block mx-auto border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Хурд</span>
                <span className="text-slate-200 font-extrabold text-lg">{filteredScores[1].wpm}</span>
                <span className="text-slate-400 text-xs font-mono ml-1">WPM</span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-900/40 rounded-2xl p-5 text-center text-slate-600 flex flex-col justify-center items-center min-h-[160px] opacity-40 order-2 md:order-1">
              <span className="text-2xl">🥈</span>
              <p className="text-xs font-mono mt-1">Одоогоор хоосон</p>
            </div>
          )}

          {/* 1st Place */}
          {filteredScores[0] ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={`1st-${selectedDifficulty}-${filteredScores[0].id}`}
              className="bg-amber-950/20 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 text-center relative overflow-hidden order-1 md:order-2 flex flex-col justify-between shadow-lg shadow-amber-500/5 ring-1 ring-amber-400/20"
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-400" />
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
              <div>
                <div className="text-4xl mb-1">👑 🥇</div>
                <h4 className="font-extrabold text-amber-200 text-lg line-clamp-1">{filteredScores[0].name}</h4>
                <div className="text-amber-400/70 text-xs mt-0.5 font-mono">{formatDate(filteredScores[0].timestamp)}</div>
              </div>
              <div className="mt-4 bg-amber-950/60 rounded-xl py-2.5 px-4 inline-block mx-auto border border-amber-500/20">
                <span className="text-amber-400/70 text-[10px] uppercase font-mono block">Аваргын Хурд</span>
                <span className="text-amber-300 font-black text-2xl">{filteredScores[0].wpm}</span>
                <span className="text-amber-400 text-xs font-mono ml-1">WPM</span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-amber-950/5 border border-amber-500/10 rounded-2xl p-6 text-center text-amber-600 flex flex-col justify-center items-center min-h-[180px] opacity-30 order-1 md:order-2">
              <span className="text-3xl">🥇</span>
              <p className="text-xs font-mono mt-1">Одоогоор хоосон</p>
            </div>
          )}

          {/* 3rd Place */}
          {filteredScores[2] ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              key={`3rd-${selectedDifficulty}-${filteredScores[2].id}`}
              className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 text-center relative overflow-hidden order-3 flex flex-col justify-between"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-amber-700" />
              <div>
                <div className="text-3xl mb-1">🥉</div>
                <h4 className="font-bold text-slate-200 line-clamp-1">{filteredScores[2].name}</h4>
                <div className="text-slate-400 text-xs mt-0.5 font-mono">{formatDate(filteredScores[2].timestamp)}</div>
              </div>
              <div className="mt-4 bg-slate-950/60 rounded-xl py-2 px-3 inline-block mx-auto border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Хурд</span>
                <span className="text-slate-200 font-extrabold text-lg">{filteredScores[2].wpm}</span>
                <span className="text-slate-400 text-xs font-mono ml-1">WPM</span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-900/40 rounded-2xl p-5 text-center text-slate-600 flex flex-col justify-center items-center min-h-[160px] opacity-40 order-3">
              <span className="text-2xl">🥉</span>
              <p className="text-xs font-mono mt-1">Одоогоор хоосон</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" /> ШИЛДЭГҮҮДИЙН ЖАГСААЛТ
          </span>
          <span className="text-xs font-mono text-slate-500">
            {filteredScores.length} бүртгэгдсэн
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono">Шилдэг тоглогчдыг уншиж байна...</p>
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm">Одоогоор энэ түвшинд оноо бүртгэгдээгүй байна.</p>
            <p className="text-xs text-slate-500">Энэ түвшний уралдаанд оролцож анхны оноогоо бүртгүүлээрэй!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-xs text-slate-400 uppercase font-mono">
                  <th className="py-3.5 px-6 font-semibold">Байр</th>
                  <th className="py-3.5 px-6 font-semibold">Нэр</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Хурд (WPM)</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Алдаа</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Нарийвчлал</th>
                  <th className="py-3.5 px-6 font-semibold">Түвшин</th>
                  <th className="py-3.5 px-6 font-semibold">Хэлбэр</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Огноо</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {topFilteredScores.map((score, index) => (
                  <tr
                    key={score.id}
                    className="hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="py-3.5 px-6 font-mono font-bold">
                      {getRankBadge(index)}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-200">
                      {score.name}
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono">
                      <span className="bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold group-hover:bg-cyan-500/20 transition-colors">
                        {score.wpm}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono text-rose-400">
                      {score.errors}
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono text-emerald-400 font-medium">
                      {score.accuracy}%
                    </td>
                    <td className="py-3.5 px-6 text-xs">
                      {score.difficulty === "easy" ? (
                        <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 font-semibold">🐢 Амархан</span>
                      ) : score.difficulty === "medium" ? (
                        <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/20 font-semibold">🚗 Дундаж</span>
                      ) : score.difficulty === "hard" ? (
                        <span className="bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded border border-rose-500/20 font-semibold">🚀 Хэцүү</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-500 px-2.5 py-1 rounded border border-slate-700 font-semibold">Түүхэн</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-xs">
                      {score.mode === "multi" ? (
                        <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">Multiplayer</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-semibold">Single</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs text-slate-500">
                      {formatDate(score.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
