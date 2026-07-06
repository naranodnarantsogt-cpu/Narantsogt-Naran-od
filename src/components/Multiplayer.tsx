import React, { useState, useEffect, useRef } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
  collection,
  addDoc
} from "firebase/firestore";
import { RoomState, PlayerState, VehicleType } from "../types";
import { Track } from "./Track";
import { getRandomSentence, SENTENCES } from "../data/sentences";
import { playWinSound } from "../utils/audio";
import { StarRewardEffect } from "./StarRewardEffect";
import {
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  Info,
  LogOut,
  Play,
  Copy,
  Check,
  Timer,
  Trophy,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Generate a random ID for the current player session
function getPlayerId() {
  let pid = sessionStorage.getItem("typeracer_pid");
  if (!pid) {
    pid = "player_" + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem("typeracer_pid", pid);
  }
  return pid;
}

// Generate a random 4-letter room code (e.g., ABCD)
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skip confusing chars like I, O, 0, 1
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function Multiplayer() {
  const myPlayerId = getPlayerId();

  // User details
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("typeracer_username") || "";
  });
  const [vehicle, setVehicle] = useState<VehicleType>(() => {
    return (localStorage.getItem("typeracer_vehicle") as VehicleType) || "slow";
  });
  const [language, setLanguage] = useState<"mongolian" | "english" | "any">("mongolian");

  // Multiplayer menu states
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active game typing states
  const [inputText, setInputText] = useState("");
  const [correctCharCount, setCorrectCharCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [localFinished, setLocalFinished] = useState(false);
  const [showStarOverlay, setShowStarOverlay] = useState(false);

  // Countdown timer for synced start
  const [syncCountdown, setSyncCountdown] = useState<number | null>(null);

  // References
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastInputLength = useRef(0);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDbUpdateRef = useRef<number>(0);

  // Listen to Room updates once inside a room
  useEffect(() => {
    if (!currentRoom?.id) return;

    const roomRef = doc(db, "typeracer_rooms", currentRoom.id);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Omit<RoomState, "id">;
        const updatedRoom = { id: snapshot.id, ...data } as RoomState;
        setCurrentRoom(updatedRoom);

        // Check if creator
        const creatorId = data.creatorId;
        setIsCreator(creatorId === myPlayerId);

        // Sync start countdown
        if (data.status === "countdown" && data.startTime) {
          const startMs = data.startTime.toMillis ? data.startTime.toMillis() : new Date(data.startTime).getTime();

          const updateCountdown = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.ceil((startMs - now) / 1000));
            setSyncCountdown(diff);

            if (diff <= 0) {
              setSyncCountdown(null);
              // Trigger local game start if not already started
              setStartTime((prev) => {
                if (prev === null) {
                  return now;
                }
                return prev;
              });
            }
          };

          updateCountdown();
          const countdownInterval = setInterval(updateCountdown, 100);

          return () => clearInterval(countdownInterval);
        } else {
          setSyncCountdown(null);
        }
      } else {
        // Room was deleted or doesn't exist anymore
        setCurrentRoom(null);
        setErrorMessage("Өрөө олдсонгүй эсвэл устгагдсан байна.");
      }
    }, (error) => {
      console.error("onSnapshot error:", error);
      try {
        handleFirestoreError(error, OperationType.GET, `typeracer_rooms/${currentRoom.id}`);
      } catch (e) {
        // Keep logging
      }
    });

    return () => unsubscribe();
  }, [currentRoom?.id, myPlayerId]);

  // Local game timer for calculating WPM in real-time
  useEffect(() => {
    const activeRoomPlaying = currentRoom?.status === "playing";
    if (activeRoomPlaying && startTime !== null && !localFinished) {
      localTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
      }, 100);
    } else {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
    }

    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
    };
  }, [currentRoom?.status, startTime, localFinished]);

  // Focus input when game starts
  useEffect(() => {
    if (currentRoom?.status === "playing" && !localFinished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentRoom?.status, localFinished]);

  // Handle typing input
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentRoom || currentRoom.status !== "playing" || localFinished) return;

    const value = e.target.value;
    const targetText = currentRoom.sentence;

    // Track errors
    if (value.length > lastInputLength.current) {
      const addedIdx = value.length - 1;
      if (value[addedIdx] !== targetText[addedIdx]) {
        setErrorCount((prev) => prev + 1);
      }
    }
    lastInputLength.current = value.length;
    setInputText(value);

    // Calculate correct consecutive progress
    let correctCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === targetText[i]) {
        correctCount++;
      } else {
        break;
      }
    }
    setCorrectCharCount(correctCount);

    const progress = (correctCount / targetText.length) * 100;
    const currentWPM = calculateWPM(correctCount, elapsedTime);

    // Sync progress to Firestore (Throttled to save database writes!)
    const now = Date.now();
    const isCompleted = value === targetText;

    if (isCompleted) {
      setLocalFinished(true);
      setShowStarOverlay(true);
      playWinSound();
      await updatePlayerProgress(100, currentWPM, errorCount, true);
      await saveScoreToGlobalLeaderboard(currentWPM, errorCount);
    } else if (now - lastDbUpdateRef.current > 400 || progress - (currentRoom.players[myPlayerId]?.progress || 0) > 4) {
      lastDbUpdateRef.current = now;
      await updatePlayerProgress(progress, currentWPM, errorCount, false);
    }
  };

  const updatePlayerProgress = async (
    progress: number,
    wpm: number,
    errors: number,
    isFinished: boolean
  ) => {
    if (!currentRoom) return;
    const roomRef = doc(db, "typeracer_rooms", currentRoom.id);

    try {
      await updateDoc(roomRef, {
        [`players.${myPlayerId}.progress`]: progress,
        [`players.${myPlayerId}.wpm`]: wpm,
        [`players.${myPlayerId}.errors`]: errors,
        [`players.${myPlayerId}.isFinished`]: isFinished,
        ...(isFinished ? { [`players.${myPlayerId}.finishedAt`]: Date.now() } : {})
      });
    } catch (err) {
      console.error("Error updating progress in DB:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `typeracer_rooms/${currentRoom.id}`);
      } catch (e) {
        // Keep logging
      }
    }
  };

  const saveScoreToGlobalLeaderboard = async (finalWPM: number, finalErrors: number) => {
    const accuracy = calculateAccuracy(currentRoom?.sentence.length || 1, finalErrors);
    
    // Find matching sentence to get true difficulty
    const matchedSentence = SENTENCES.find(s => s.text === currentRoom?.sentence);
    const difficultyVal = matchedSentence?.difficulty || (vehicle === "slow" ? "easy" : vehicle === "fast" ? "medium" : "hard");

    try {
      const scoresRef = collection(db, "typeracer_scores");
      await addDoc(scoresRef, {
        name: username.trim(),
        wpm: finalWPM,
        errors: finalErrors,
        accuracy: accuracy,
        timestamp: serverTimestamp(),
        mode: "multi",
        difficulty: difficultyVal
      });
    } catch (err) {
      console.error("Error saving score to leaderboard:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "typeracer_scores");
      } catch (e) {
        // Keep logging
      }
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

  // Actions
  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setErrorMessage("Нэрээ оруулна уу.");
      return;
    }
    setErrorMessage(null);
    setJoining(true);

    localStorage.setItem("typeracer_username", username.trim());
    localStorage.setItem("typeracer_vehicle", vehicle);

    const roomCode = generateRoomCode();
    const difficultyMap: { [key in VehicleType]: "easy" | "medium" | "hard" } = {
      slow: "easy",
      fast: "medium",
      fastest: "hard"
    };
    const diff = difficultyMap[vehicle] || "easy";
    const sentenceObj = getRandomSentence(language, diff);

    const initialPlayer: PlayerState = {
      id: myPlayerId,
      name: username.trim(),
      progress: 0,
      wpm: 0,
      errors: 0,
      isFinished: false,
      vehicle: vehicle
    };

    const roomData = {
      status: "waiting",
      sentence: sentenceObj.text,
      countdown: 10,
      startTime: null,
      creatorId: myPlayerId,
      createdAt: serverTimestamp(),
      players: {
        [myPlayerId]: initialPlayer
      }
    };

    try {
      const roomRef = doc(db, "typeracer_rooms", roomCode);
      await setDoc(roomRef, roomData);
      setCurrentRoom({ id: roomCode, ...roomData } as any);
      setIsCreator(true);
      resetLocalGameState();
    } catch (err) {
      console.error("Error creating room:", err);
      setErrorMessage("Өрөө үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
      try {
        handleFirestoreError(err, OperationType.CREATE, `typeracer_rooms/${roomCode}`);
      } catch (e) {
        // Keep logging
      }
    } finally {
      setJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!username.trim()) {
      setErrorMessage("Нэрээ оруулна уу.");
      return;
    }
    if (!code) {
      setErrorMessage("Өрөөний код оруулна уу.");
      return;
    }
    setErrorMessage(null);
    setJoining(true);

    localStorage.setItem("typeracer_username", username.trim());
    localStorage.setItem("typeracer_vehicle", vehicle);

    try {
      const roomRef = doc(db, "typeracer_rooms", code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setErrorMessage("Уучлаарай, ийм кодтой өрөө олдсонгүй.");
        setJoining(false);
        return;
      }

      const roomData = roomSnap.data() as RoomState;

      if (roomData.status !== "waiting") {
        setErrorMessage("Энэ өрөөний тоглоом аль хэдийн эхэлсэн байна.");
        setJoining(false);
        return;
      }

      // Check if players count is full (e.g. limit to 5 players per room)
      const playersList = Object.values(roomData.players || {});
      if (playersList.length >= 6) {
        setErrorMessage("Энэ өрөө дүүрсэн байна (дээд тал нь 6 тоглогч).");
        setJoining(false);
        return;
      }

      const newPlayer: PlayerState = {
        id: myPlayerId,
        name: username.trim(),
        progress: 0,
        wpm: 0,
        errors: 0,
        isFinished: false,
        vehicle: vehicle
      };

      await updateDoc(roomRef, {
        [`players.${myPlayerId}`]: newPlayer
      });

      setCurrentRoom({ id: code, ...roomData, players: { ...roomData.players, [myPlayerId]: newPlayer } });
      setIsCreator(false);
      resetLocalGameState();
    } catch (err) {
      console.error("Error joining room:", err);
      setErrorMessage("Өрөөнд холбогдоход алдаа гарлаа.");
      try {
        handleFirestoreError(err, OperationType.UPDATE, `typeracer_rooms/${code}`);
      } catch (e) {
        // Keep logging
      }
    } finally {
      setJoining(false);
    }
  };

  const resetLocalGameState = () => {
    setInputText("");
    setCorrectCharCount(0);
    setErrorCount(0);
    setStartTime(null);
    setElapsedTime(0);
    setLocalFinished(false);
    setSyncCountdown(null);
    lastInputLength.current = 0;
    lastDbUpdateRef.current = 0;
  };

  const handleStartRace = async () => {
    if (!currentRoom || !isCreator) return;

    const roomRef = doc(db, "typeracer_rooms", currentRoom.id);
    const startTimestamp = Date.now() + 6000; // start in 6 seconds

    try {
      await updateDoc(roomRef, {
        status: "countdown",
        startTime: new Date(startTimestamp)
      });
    } catch (err) {
      console.error("Error starting countdown in DB:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `typeracer_rooms/${currentRoom.id}`);
      } catch (e) {
        // Keep logging
      }
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;

    const roomRef = doc(db, "typeracer_rooms", currentRoom.id);
    try {
      // Remove self from players map
      const updatedPlayers = { ...currentRoom.players };
      delete updatedPlayers[myPlayerId];

      const remainingPlayers = Object.values(updatedPlayers) as PlayerState[];

      if (remainingPlayers.length === 0) {
        // If no players left, we can delete room or update
        await updateDoc(roomRef, { players: {} }); // empty
      } else {
        const nextCreatorId = remainingPlayers[0].id;
        await updateDoc(roomRef, {
          players: updatedPlayers,
          ...(currentRoom.creatorId === myPlayerId ? { creatorId: nextCreatorId } : {})
        });
      }
    } catch (err) {
      console.error("Error leaving room:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `typeracer_rooms/${currentRoom.id}`);
      } catch (e) {
        // Keep logging
      }
    } finally {
      setCurrentRoom(null);
      resetLocalGameState();
    }
  };

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePlayers = currentRoom ? (Object.values(currentRoom.players) as PlayerState[]) : [];
  const currentSentence = currentRoom?.sentence || "";

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!currentRoom ? (
          /* MULTIPLAYER MENU SCREEN */
          <motion.div
            key="lobby-menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">ХАМТДАА УРАЛДАХ (MULTIPLAYER)</h3>
                <p className="text-xs text-slate-400">Найзуудтайгаа болон бусад тоглогчидтой бодит хугацаанд уралдаарай</p>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl border border-rose-500/20 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Set Name & Vehicle selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Миний нэр
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="Тоглогчийн нэр..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-slate-200 outline-none placeholder:text-slate-600 transition-colors"
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
                            ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
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

              {/* Lobby Join Options */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Өрөөнд орох
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Өрөөний код (Жишээ нь: ABCD)"
                        maxLength={6}
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-sm uppercase placeholder:text-slate-700 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleJoinRoom}
                        disabled={joining || !roomCodeInput.trim() || !username.trim()}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-5 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        ОРОХ <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-center py-2 text-slate-500 text-xs font-mono">
                    ЭСВЭЛ НАЙЗУУДЫГАА УРИХ ШИНЭ ӨРӨӨ ҮҮСГЭХ:
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={handleCreateRoom}
                        disabled={joining || !username.trim()}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/5 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3px]" /> ӨРӨӨ ҮҮСГЭХ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/30 p-3 rounded-lg text-[10px] text-slate-500 font-mono text-center border border-slate-900">
                  ⚡️ Бодит цагийн хугацааны өгөгдөл Firestore-оор шууд дамжина.
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* MULTIPLAYER GAME LOBBY / ACTIVE PLAY SCREEN */
          <motion.div
            key="active-room"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Room Banner / Info header */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="bg-slate-950 hover:bg-slate-800 text-rose-400 hover:text-rose-300 p-2.5 rounded-xl border border-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> ӨРӨӨНӨӨС ГАРАХ
                </button>
                <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />
                <div>
                  <div className="text-xs text-slate-400 font-mono">ӨРӨӨНИЙ КОД</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black font-mono tracking-wider text-purple-400">
                      {currentRoom.id}
                    </span>
                    <button
                      type="button"
                      onClick={copyRoomCode}
                      className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800/60 transition-colors"
                      title="Код хуулах"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-3">
                {currentRoom.status === "waiting" && (
                  <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1.5 rounded-xl border border-amber-500/20 font-mono font-medium flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    Тоглогч хүлээж байна...
                  </span>
                )}
                {currentRoom.status === "countdown" && (
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1.5 rounded-xl border border-indigo-500/20 font-mono font-bold flex items-center gap-1.5">
                    <Timer className="w-4 h-4 animate-spin" />
                    Уралдаан эхлэхэд {syncCountdown !== null ? syncCountdown : "6"}s
                  </span>
                )}
                {currentRoom.status === "playing" && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-xl border border-emerald-500/20 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    УРАЛДААН ЭХЭЛЛЭЭ!
                  </span>
                )}
              </div>
            </div>

            {/* Live Racing Track showing all room players! */}
            <Track players={activePlayers} currentPlayerId={myPlayerId} />

            {/* Room Lobby Details (Joined players roster) */}
            {currentRoom.status === "waiting" && (
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-800 flex justify-between items-center">
                  <span>Орсон тоглогчид ({activePlayers.length}/6)</span>
                  <span className="text-[10px] text-slate-500">Уралдахыг хүлээж буй тоглогчид</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activePlayers.map((player) => {
                    const isCreatorPlayer = player.id === currentRoom.creatorId;
                    return (
                      <div
                        key={player.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          player.id === myPlayerId
                            ? "bg-purple-500/10 border-purple-500/30"
                            : "bg-slate-950/60 border-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">
                            {player.vehicle === "slow" ? "🐢" : player.vehicle === "fast" ? "🚗" : "🚀"}
                          </span>
                          <span className={`font-semibold text-sm ${player.id === myPlayerId ? "text-purple-400" : "text-slate-300"}`}>
                            {player.name}
                          </span>
                        </div>
                        {isCreatorPlayer && (
                          <span className="bg-amber-500/10 text-amber-400 p-1 rounded border border-amber-500/20" title="Өрөөний эзэн">
                            <Crown className="w-3.5 h-3.5 fill-amber-400" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isCreator ? (
                  <button
                    type="button"
                    onClick={handleStartRace}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <Play className="w-4 h-4 fill-slate-950" /> УРАЛДААНЫГ ЭХЛҮҮЛЭХ
                  </button>
                ) : (
                  <div className="text-center py-4 bg-slate-950/30 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                    👑 Өрөөний эзэн ({activePlayers.find((p) => p.id === currentRoom.creatorId)?.name || "Хүлээгдэж байна"}) уралдааныг эхлүүлнэ. Түр хүлээнэ үү...
                  </div>
                )}
              </div>
            )}

            {/* Countdown Screen overlay */}
            {currentRoom.status === "countdown" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/80 border border-slate-800 p-12 rounded-2xl text-center space-y-4 shadow-2xl max-w-md mx-auto"
              >
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">УРАЛДААН ЭХЛЭХЭД</div>
                <div className="text-7xl font-black font-mono text-purple-400 animate-bounce">
                  {syncCountdown !== null && syncCountdown > 0 ? syncCountdown : "БАЙРТАА!"}
                </div>
                <p className="text-xs text-slate-400">Гар сунгаж, бэлэн болоорой!</p>
              </motion.div>
            )}

            {/* Active typing dashboard */}
            {currentRoom.status === "playing" && (
              <div className="space-y-6">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
                  {/* Sentence container */}
                  <div className="bg-slate-950/90 rounded-2xl p-6 border border-slate-800/60 leading-relaxed text-lg tracking-wide select-none font-mono min-h-24 flex items-center">
                    <div className="text-slate-300">
                      {currentSentence.split("").map((char, index) => {
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
                          colorClass = "text-purple-400 font-black animate-pulse border-b-2 border-purple-400";
                        }

                        return (
                          <span key={index} className={`${colorClass} ${bgClass} transition-all px-[1px]`}>
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input element */}
                  {!localFinished ? (
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder="Бичиж эхэлнэ үү..."
                        className={`w-full bg-slate-950 border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-xl px-5 py-4 text-slate-100 font-mono text-lg outline-none transition-all placeholder:text-slate-700 ${
                          inputText.length > 0 && inputText[inputText.length - 1] !== currentSentence[inputText.length - 1]
                            ? "border-rose-500 bg-rose-950/10"
                            : "border-slate-800"
                        }`}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                        {inputText.length} / {currentSentence.length} тэмдэгт
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
                      <Trophy className="w-5 h-5 fill-emerald-400" />
                      Барианд орлоо! Бусад тоглогчид дуусахыг хүлээнэ үү.
                    </div>
                  )}

                  {/* Live metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Миний Хурд</span>
                      <span className="text-xl font-black font-mono text-purple-400">
                        {calculateWPM(correctCharCount, elapsedTime)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">WPM</span>
                    </div>
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Алдаа</span>
                      <span className="text-xl font-black font-mono text-rose-400">{errorCount}</span>
                    </div>
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Хугацаа</span>
                      <span className="text-xl font-black font-mono text-indigo-400">
                        {Math.floor(elapsedTime)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scoreboard List of racers */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-800">
                    ТОГЛОГЧДЫН АМЖИЛТ
                  </div>
                  <div className="divide-y divide-slate-800/50 mt-2">
                    {activePlayers
                      .sort((a, b) => (b.progress - a.progress) || (a.finishedAt || 0) - (b.finishedAt || 0))
                      .map((player, index) => {
                        return (
                          <div key={player.id} className="py-3 flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-500 font-bold">#{index + 1}</span>
                              <span className="text-lg">
                                {player.vehicle === "slow" ? "🐢" : player.vehicle === "fast" ? "🚗" : "🚀"}
                              </span>
                              <span className={`font-semibold ${player.id === myPlayerId ? "text-purple-400" : "text-slate-300"}`}>
                                {player.name} {player.id === myPlayerId && "(Би)"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 font-mono text-xs">
                              <span className="text-slate-400">{Math.round(player.progress)}%</span>
                              <span className="text-amber-400 font-bold">{player.wpm} WPM</span>
                              {player.isFinished && (
                                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20 font-bold">
                                  Бариа
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showStarOverlay && (
        <StarRewardEffect
          difficulty={vehicle}
          onComplete={() => setShowStarOverlay(false)}
        />
      )}
    </div>
  );
}
