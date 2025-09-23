
import type { Timestamp } from 'firebase/firestore';

export type HouseName = 'Halwa' | 'Chamcham' | 'Jalebi' | 'Ladoo';

export interface TeamMember {
  name: string;
  house: HouseName;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  score: number;
  riddlesSolved: number;
  currentPuzzleIndex: number;
  secretCode: string;
  pathId?: number;
  currentSubmissionId?: string | null;
  onlineMembers?: { [key: string]: Timestamp };
  currentPuzzleStartTime?: Timestamp;
  gameStartTime?: Timestamp;
  revealedHints?: string[];
  finishTime?: Timestamp;
  finishRank?: number;
}

export interface Puzzle {
  id: string; 
  title: string;
  puzzle:string;
  hint?: string;
  answer?: string;
  pathId?: number;
  order?: number;
}

export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  puzzleId: string;
  puzzleTitle: string;
  textSubmission: string;
  imageSubmissionDataUri?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  submittedBy?: string;
}

export interface GameSettings {
    isStarted: boolean;
    isRegistrationOpen: boolean;
    startTime?: Timestamp;
    allowExit?: boolean;
}
