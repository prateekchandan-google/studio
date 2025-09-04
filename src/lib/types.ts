export interface Team {
  id: string;
  name: string;
  house: 'Halwa' | 'Chamcham' | 'Jalebi' | 'Ladoo';
  members: string[];
  score: number;
  riddlesSolved: number;
  currentPuzzleIndex: number;
  secretCode: string;
}

export interface Puzzle {
  id: string; // Changed from number to string to support Firestore IDs
  title: string;
  description:string;
  hint: string;
  solution: string;
}

export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  puzzleId: string; // Changed from number to string
  puzzleTitle: string;
  textSubmission: string;
  imageSubmissionUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  submittedBy?: string;
}
