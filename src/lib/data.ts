import type { Team, Puzzle, Submission } from './types';

export const puzzles: Puzzle[] = [
  {
    id: 1,
    title: 'The Echoing Cave',
    description: 'I have a voice but cannot speak. I have a bed but never sleep. What am I?',
    hint: 'Think about a natural formation that carries sound.',
    solution: 'A river',
  },
  {
    id: 2,
    title: 'The Merchant\'s Dilemma',
    description: 'A merchant can place 8 large boxes or 10 small boxes into a carton for shipping. In one shipment, he sent a total of 96 boxes. If there are more large boxes than small boxes, how many cartons did he ship?',
    hint: 'This is a system of equations problem.',
    solution: '11 cartons in total. 7 cartons of large boxes (7 * 8 = 56 boxes) and 4 cartons of small boxes (4 * 10 = 40 boxes).',
  },
  {
    id: 3,
    title: 'The Timeless Watch',
    description: 'What has a face and two hands but no arms or legs?',
    hint: 'It helps you know when to be somewhere.',
    solution: 'A clock',
  },
  {
    id: 4,
    title: 'The Featherlight Burden',
    description: 'What is so fragile that saying its name breaks it?',
    hint: 'The absence of sound.',
    solution: 'Silence',
  }
];

export const teams: Team[] = [
  { id: 'T1', name: 'The Halwa Heroes', house: 'Halwa', score: 100, riddlesSolved: 2, currentPuzzleIndex: 2 },
  { id: 'T2', name: 'Chamcham Champs', house: 'Chamcham', score: 125, riddlesSolved: 3, currentPuzzleIndex: 3 },
  { id: 'T3', name: 'Jalebi Giants', house: 'Jalebi', score: 95, riddlesSolved: 2, currentPuzzleIndex: 2 },
  { id: 'T4', name: 'Ladoo Legends', house: 'Ladoo', score: 80, riddlesSolved: 1, currentPuzzleIndex: 1 },
  { id: 'T5', name: 'Halwa Hustlers', house: 'Halwa', score: 50, riddlesSolved: 1, currentPuzzleIndex: 1 },
];

export const submissions: Submission[] = [
    {
        id: 'S1',
        teamId: 'T3',
        teamName: 'Jalebi Giants',
        puzzleId: 2,
        puzzleTitle: 'The Merchant\'s Dilemma',
        textSubmission: 'We think the answer is 11 cartons. We used algebra to solve it. 7 large and 4 small.',
        imageSubmissionUrl: 'https://picsum.photos/400/300',
        status: 'pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
    },
    {
        id: 'S2',
        teamId: 'T4',
        teamName: 'Ladoo Legends',
        puzzleId: 1,
        puzzleTitle: 'The Echoing Cave',
        textSubmission: 'Is it a river? It has a riverbed!',
        status: 'pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
    }
];
