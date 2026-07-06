import React, { useState, useEffect, useRef } from "react";
import { getRandomSentence, Sentence } from "../data/sentences";
import { Track } from "./Track";
import { PlayerState, VehicleType } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { RotateCcw, Play, Sparkles, CheckCircle2, AlertCircle, Info, Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playWinSound } from "../utils/audio";
import { StarRewardEffect } from "./StarRewardEffect";

export function SinglePlayer() {
  // User profile
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("typeracer_username") || "";
  });
  const [vehicle, setVehicle] = useState<VehicleType>(() => {
    return (localStorage.getItem("typeracer_vehicle") as VehicleType) || "slow";
  });
  const [language, setLanguage] = useState<"mongolian" | "english" | "any">("mongolian");
  const [nameSubmitted, setNameSubmitted] = useState<boolean>(() => {
    return !!localStorage.getItem("typeracer_username");
  });

  // Game state
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [inputText, setInputText] = useState("");
  const [gameState, setGameState] = useState<"idle" | "playing" | "completed" | "failed">("idle");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [errorCount, setErrorCount] = useState(0);
  const [correctCharCount, setCorrectCharCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedScoreId, setSavedScoreId] = useState<string | null>(null);
  const [showStarOverlay, setShowStarOverlay] = useState(false);

  // Key tracking to prevent double counting errors
  const lastInputLength = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const getLimitSeconds = (v: VehicleType): number => {
    if (v === "slow") return 60;
    if (v === "fast") return 120;
    return 140;
  };

  // Load initial random sentence or reload when settings change before starting
  useEffect(() => {
    if (gameState === "idle") {
      const difficultyMap: { [key in VehicleType]: "easy" | "medium" | "hard" } = {
        slow: "easy",
        fast: "medium",
        fastest: "hard"
      };
      const diff = difficultyMap[vehicle] || "easy";
      setSentence(getRandomSentence(language, diff));
    }
  }, [gameState, language, vehicle]);

  // Handle timer
  useEffect(() => {
    if (gameState === "playing" && startTime !== null) {
      const limit = getLimitSeconds(vehicle);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= limit) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setElapsedTime(limit);
          setGameState("failed");
        } else {
          setElapsedTime(elapsed);
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, startTime, vehicle]);

  // Focus input when game starts
  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  const handleStartGame = () => {
    if (!username.trim()) return;
    localStorage.setItem("typeracer_username", username.trim());
    localStorage.setItem("typeracer_vehicle", vehicle);
    setNameSubmitted(true);

    const difficultyMap: { [key in VehicleType]: "easy" | "medium" | "hard" } = {
      slow: "easy",
      fast: "medium",
      fastest: "hard"
    };
    const diff = difficultyMap[vehicle] || "easy";
    const newSentence = getRandomSentence(language, diff);
    setSentence(newSentence);
    setInputText("");
    setGameState("playing");
    setStartTime(Date.now());
    setElapsedTime(0);
    setErrorCount(0);
    setCorrectCharCount(0);
    setSavedScoreId(null);
    lastInputLength.current = 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== "playing" || !sentence) return;

    const value = e.target.value;
    const targetText = sentence.text;

    // Check for backspace or addition
    if (value.length > lastInputLength.current) {
      const addedCharIndex = value.length - 1;
      // If user typed character and it doesn't match the exact position, increment error count
      if (value[addedCharIndex] !== targetText[addedCharIndex]) {
        setErrorCount((prev) => prev + 1);
      }
    }

    lastInputLength.current = value.length;
    setInputText(value);

    // Calculate maximum correct consecutive characters from start
    let correctConsecutive = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === targetText[i]) {
        correctConsecutive++;
      } else {
        break; // Stop at first mismatch to enforce sequential correctness
      }
    }
    setCorrectCharCount(correctConsecutive);

    // Check for completion
    if (value === targetText) {
      handleCompleteGame(correctConsecutive);
    }
  };

  const handleCompleteGame = async (finalCorrectCount: number) => {
    setGameState("completed");
    setShowStarOverlay(true);
    playWinSound();
    const endTime = Date.now();
    const finalElapsed = (endTime - (startTime || endTime)) / 1000;
    setElapsedTime(finalElapsed);

    // Calculate final metrics
    const finalWPM = calculateWPM(finalCorrectCount, finalElapsed);
    const finalAccuracy = calculateAccuracy(sentence?.text.length || 1, errorCount);

    // Auto-save score to Firestore
    setIsSaving(true);
    try {
      const scoresRef = collection(db, "typeracer_scores");
      const docRef = await addDoc(scoresRef, {
        name: username.trim(),
        wpm: finalWPM,
        errors: errorCount,
        accuracy: finalAccuracy,
        timestamp: serverTimestamp(),
        mode: "single",
        difficulty: sentence?.difficulty || (vehicle === "slow" ? "easy" : vehicle === "fast" ? "medium" : "hard")
      });
      setSavedScoreId(docRef.id);
    } catch (error) {
      console.error("Error saving score:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, "typeracer_scores");
      } catch (e) {
        // Keep logging
      }
    } finally {
      setIsSaving(false);
    }
  };

  const calculateWPM = (correctChars: number, seconds: number) => {
    if (seconds <= 0) return 0;
    const words = correctChars / 5;
    const minutes = seconds / 60;
    return Math.round(words / minutes);
  };

  const calculateAccuracy = (totalChars: number, errors: number) => {
    if (totalChars === 0) return 100;
    const accuracy = ((totalChars - Math.min(totalChars, errors)) / totalChars) * 100;
    return Math.round(accuracy);
  };

  const handlePlayAgain = () => {
    setInputText("");
    setGameState("idle");
    setElapsedTime(0);
    setErrorCount(0);
    setCorrectCharCount(0);
    setSavedScoreId(null);
    lastInputLength.current = 0;
    // Load a fresh sentence matching selected speed/difficulty
    const difficultyMap: { [key in VehicleType]: "easy" | "medium" | "hard" } = {
      slow: "easy",
      fast: "medium",
      fastest: "hard"
    };
    const diff = difficultyMap[vehicle] || "easy";
    setSentence(getRandomSentence(language, diff));
  };

  const currentWPM = calculateWPM(correctCharCount, elapsedTime);
  const currentAccuracy = calculateAccuracy(inputText.length, errorCount);
  const progressPercent = sentence ? (correctCharCount / sentence.text.length) * 100 : 0;

  // Build current player state for Track renderer
  const localPlayerState: PlayerState = {
    id: "me",
    name: username || "Тоглогч",
    progress: progressPercent,
    wpm: currentWPM,
    errors: errorCount,
    isFinished: gameState === "completed",
    vehicle: vehicle
  };

  return (
    <div className="space-y-6">
      {/* Configuration View / Setup */}
      {!nameSubmitted || gameState === "idle" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">ГАНЦААРЧИЛСАН ТОГЛООМ</h3>
              <p className="text-xs text-slate-400">Шинэ уралдаанд бэлдэж, үзүүлэлтээ ахиулаарай</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Nickname & Vehicle */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Тоглогчийн нэр
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Нэрээ оруулна уу..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-slate-200 outline-none font-sans placeholder:text-slate-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Хурд болон Хүндрэл (Speed & Difficulty)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["slow", "fast", "fastest"] as VehicleType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicle(type)}
                      className={`flex flex-col items-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                        vehicle === type
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      <span className="text-2xl">
                        {type === "slow" ? "🐢" : type === "fast" ? "🚗" : "🚀"}
                      </span>
                      <span className="font-semibold text-center text-xs">
                        {type === "slow" ? "Slow / Амархан" : type === "fast" ? "Fast / Дундаж" : "Fastest / Хэцүү"}
                      </span>
                      <span className="text-amber-400 text-xs mt-1 font-mono tracking-wider">
                        {type === "slow" ? "⭐" : type === "fast" ? "⭐⭐" : "⭐⭐⭐⭐"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Language & Info */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Бичих хэл
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "mongolian", label: "🇲🇳 Монгол" },
                    { id: "english", label: "🇬🇧 Англи" },
                    { id: "any", label: "🎲 Холимог" }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguage(lang.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${
                        language === lang.id
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                <span className="font-mono text-indigo-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> ДҮРЭМ:
                </span>
                <p>
                  Дэлгэц дээр харагдах өгүүлбэрийг алдаагүй, хурдан бичнэ. Зөв бичсэн үсгүүд <span className="text-emerald-400 font-bold">ногоон</span>, алдаатай нь <span className="text-rose-400 font-bold">улаан</span> өнгөөр тэмдэглэгдэнэ. Таны хурдаас хамааран таны сонгосон хөлөг урагшилна.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            disabled={!username.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 hover:from-cyan-400 hover:to-indigo-400 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold py-4 px-6 rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> УРАЛДААНЫГ ЭХЛҮҮЛЭХ
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Progress Race Track */}
          <Track players={[localPlayerState]} currentPlayerId="me" />

          {/* Typing Panel */}
          {gameState === "playing" && sentence && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6"
            >
              {/* Target Sentence Typography box */}
              <div className="bg-slate-950/90 rounded-2xl p-6 border border-slate-800/60 leading-relaxed text-lg tracking-wide select-none font-mono min-h-24 flex items-center">
                <div className="text-slate-300">
                  {sentence.text.split("").map((char, index) => {
                    let colorClass = "text-slate-400";
                    let bgClass = "";

                    if (index < inputText.length) {
                      if (inputText[index] === char) {
                        colorClass = "text-emerald-400 font-bold";
                        bgClass = "bg-emerald-500/10 rounded-xs";
                      } else {
                        colorClass = "text-rose-400 font-bold underline decoration-rose-500 decoration-2";
                        bgClass = "bg-rose-500/15 rounded-xs";
                      }
                    } else if (index === inputText.length) {
                      colorClass = "text-cyan-400 font-black animate-pulse border-b-2 border-cyan-400";
                    }

                    return (
                      <span key={index} className={`${colorClass} ${bgClass} transition-all px-[1px]`}>
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Text Input Field */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Энд бичиж эхэлнэ үү..."
                  className={`w-full bg-slate-950 border focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 rounded-xl px-5 py-4 text-slate-100 font-mono text-lg outline-none transition-all placeholder:text-slate-700 ${
                    inputText.length > 0 && inputText[inputText.length - 1] !== sentence.text[inputText.length - 1]
                      ? "border-rose-500 bg-rose-950/10"
                      : "border-slate-800"
                  }`}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                  {inputText.length} / {sentence.text.length} тэмдэгт
                </div>
              </div>

              {/* Live Real-time Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Хурд</span>
                  <span className="text-xl font-black font-mono text-cyan-400">{currentWPM}</span>
                  <span className="text-[10px] text-slate-400 ml-1">WPM</span>
                </div>
                <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Алдаа</span>
                  <span className="text-xl font-black font-mono text-rose-400">{errorCount}</span>
                </div>
                <div className={`bg-slate-950/40 rounded-xl p-3 border text-center transition-all duration-300 ${
                  getLimitSeconds(vehicle) - elapsedTime <= 10
                    ? "border-rose-500/50 bg-rose-950/10 shadow-[0_0_10px_rgba(239,68,68,0.1)] animate-pulse"
                    : "border-slate-800"
                }`}>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Үлдсэн хугацаа</span>
                  <span className={`text-xl font-black font-mono ${
                    getLimitSeconds(vehicle) - elapsedTime <= 10 ? "text-rose-400" : "text-indigo-400"
                  }`}>
                    {Math.max(0, Math.ceil(getLimitSeconds(vehicle) - elapsedTime))}s
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Completed Screen Card */}
          {gameState === "completed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-xl mx-auto relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />

              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto animate-bounce">
                🎉
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-100">Барианд орлоо!</h3>
                <p className="text-xs text-slate-400 mt-1">Оноо тань амжилттай хадгалагдлаа</p>
                <div className="mt-3 flex items-center justify-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full w-max mx-auto">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider mr-1">Шан харамж:</span>
                  {vehicle === "slow" && <span className="text-amber-400">⭐ (1 ОД)</span>}
                  {vehicle === "fast" && <span className="text-amber-400">⭐⭐ (2 ОД)</span>}
                  {vehicle === "fastest" && <span className="text-amber-400">⭐⭐⭐⭐ (4 ОД)</span>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Хурд</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono">
                    {calculateWPM(sentence?.text.length || 0, elapsedTime)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">WPM</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Алдаа</span>
                  <span className="text-2xl font-black text-rose-400 font-mono">{errorCount}</span>
                  <span className="text-[10px] text-slate-400 block">Удаа</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Нарийвчлал</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {calculateAccuracy(sentence?.text.length || 1, errorCount)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Оноо</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Нийт хугацаа: {elapsedTime.toFixed(1)} секунд
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 px-6 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <RotateCcw className="w-4 h-4" /> ДАХИН ТОГЛОХ
                </button>
              </div>
            </motion.div>
          )}

          {/* Failed Screen Card */}
          {gameState === "failed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/80 backdrop-blur-md border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-xl mx-auto relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-rose-600 to-red-500" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl" />

              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center text-3xl mx-auto animate-pulse">
                ⏱️
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-100">Хугацаа дууслаа!</h3>
                <p className="text-sm text-slate-400 mt-1">Та уралдааныг амжилттай дуусгаж чадсангүй.</p>
                <div className="mt-3 bg-red-500/10 border border-red-500/20 px-3 py-1 text-red-400 rounded-full w-max mx-auto text-xs font-semibold">
                  Түвшин: {vehicle === "slow" ? "Амархан" : vehicle === "fast" ? "Дундаж" : "Хэцүү"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Амжилт</span>
                  <span className="text-xl font-black text-rose-400 font-mono">
                    {Math.round(progressPercent)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">Гүйцэтгэл</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Алдаа</span>
                  <span className="text-xl font-black text-rose-400 font-mono">{errorCount}</span>
                  <span className="text-[10px] text-slate-400 block">Удаа</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-slate-950 font-black py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/10 hover:shadow-red-500/20 font-sans"
                >
                  <RotateCcw className="w-4 h-4" /> ДАХИН ОРОЛДОХ
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {showStarOverlay && (
        <StarRewardEffect
          difficulty={vehicle}
          onComplete={() => setShowStarOverlay(false)}
        />
      )}
    </div>
  );
}
