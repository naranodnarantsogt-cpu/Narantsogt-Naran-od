export type VehicleType = "slow" | "fast" | "fastest";

export interface ScoreEntry {
  id?: string;
  name: string;
  wpm: number;
  errors: number;
  accuracy: number;
  timestamp: any; // Firestore Timestamp
  mode: "single" | "multi";
  difficulty?: "easy" | "medium" | "hard";
}

export interface PlayerState {
  id: string;
  name: string;
  progress: number; // 0 to 100 %
  wpm: number;
  errors: number;
  isFinished: boolean;
  finishedAt?: number;
  vehicle: VehicleType;
}

export interface RoomState {
  id: string; // Room code
  status: "waiting" | "countdown" | "playing" | "finished";
  sentence: string;
  countdown: number;
  startTime: any; // Firestore Timestamp
  players: { [id: string]: PlayerState };
  creatorId: string;
  createdAt: any; // Firestore Timestamp
}
