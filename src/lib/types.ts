export interface Team {
  id: string;
  name: string;
  house: 'Halwa' | 'Chamcham' | 'Jalebi' | 'Ladoo';
  score: number;
  riddlesSolved: number;
  currentPuzzleIndex: number;
}

export interface Puzzle {
  id: number;
  title: string;
  description: string;
  hint: string;
  solution: string;
}

export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  puzzleId: number;
  puzzleTitle: string;
  textSubmission: string;
  imageSubmissionUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}
