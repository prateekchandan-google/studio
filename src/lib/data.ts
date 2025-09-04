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

// Teams will now be fetched from Firestore
export const teams: Team[] = [];

export const submissions: Submission[] = [
    {
        id: 'S1',
        teamId: 'jalebi',
        teamName: 'Jalebi Giants',
        puzzleId: 2,
        puzzleTitle: 'The Merchant\'s Dilemma',
        textSubmission: 'We think the answer is 11 cartons. We used algebra to solve it. 7 large and 4 small.',
        imageSubmissionUrl: 'https://picsum.photos/400/300',
        status: 'pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        submittedBy: "Yara"
    },
    {
        id: 'S2',
        teamId: 'ladoo',
        teamName: 'Ladoo Legends',
        puzzleId: 1,
        puzzleTitle: 'The Echoing Cave',
        textSubmission: 'Is it a river? It has a riverbed!',
        status: 'pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        submittedBy: "Zane"
    }
];
