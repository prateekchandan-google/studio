

export interface Team {
  id: string;
  name: string;
  house: 'Halwa' | 'Chamcham' | 'Jalebi' | 'Ladoo';
  members: string[];
  score: number;
  riddlesSolved: number;
  currentPuzzleIndex: number;
  secretCode: string;
  pathId?: number;
  currentSubmissionId?: string | null;
  onlineMembers?: { [key: string]: any };
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
