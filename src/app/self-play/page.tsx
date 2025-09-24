
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Puzzle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader, Lightbulb, Key, SkipForward, Trophy, RotateCcw, BrainCircuit } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'pathfinder-self-play-completed';

export default function SelfPlayPage() {
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([]);
  const [completedPuzzles, setCompletedPuzzles] = useState<string[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Fetch all puzzles from Firestore on initial load
  useEffect(() => {
    const puzzlesQuery = query(collection(db, 'puzzles'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(puzzlesQuery, (snapshot) => {
      const puzzlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
      setAllPuzzles(puzzlesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to fetch puzzles:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load completed puzzles from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedCompleted) {
      setCompletedPuzzles(JSON.parse(savedCompleted));
    }
  }, []);

  // Filter out completed puzzles
  const unsolvedPuzzles = useMemo(() => {
    return allPuzzles.filter(p => !completedPuzzles.includes(p.id));
  }, [allPuzzles, completedPuzzles]);

  // Select a new random puzzle when the list of unsolved puzzles changes
  useEffect(() => {
    if (unsolvedPuzzles.length > 0) {
      const randomIndex = Math.floor(Math.random() * unsolvedPuzzles.length);
      setCurrentPuzzle(unsolvedPuzzles[randomIndex]);
    } else {
      setCurrentPuzzle(null);
    }
    // Reset views for new puzzle
    setShowHint(false);
    setShowAnswer(false);
  }, [unsolvedPuzzles]);

  const handleNextPuzzle = () => {
    if (currentPuzzle) {
      const newCompleted = [...completedPuzzles, currentPuzzle.id];
      setCompletedPuzzles(newCompleted);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCompleted));
    }
  };

  const handleResetProgress = () => {
    setCompletedPuzzles([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-3">
            <BrainCircuit className="w-8 h-8" /> Self Play Mode
          </CardTitle>
          <CardDescription>Solve puzzles at your own pace. Your progress is saved in your browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 min-h-[20rem]">
          {currentPuzzle ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{currentPuzzle.title}</h2>
              <p className="text-lg whitespace-pre-wrap">{currentPuzzle.puzzle}</p>

              {showHint && currentPuzzle.hint && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-300">Hint</AlertTitle>
                  <AlertDescription className="text-yellow-700 dark:text-yellow-200">{currentPuzzle.hint}</AlertDescription>
                </Alert>
              )}

              {showAnswer && currentPuzzle.answer && (
                <Alert className="border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-200">
                  <Key className="h-4 w-4 text-green-500" />
                  <AlertTitle className="font-bold text-green-800 dark:text-green-300">Answer</AlertTitle>
                  <AlertDescription className="font-mono text-sm text-green-700 dark:text-green-200">{currentPuzzle.answer}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <Trophy className="mx-auto h-12 w-12 text-yellow-400" />
              <h2 className="mt-4 text-2xl font-semibold">You've solved them all!</h2>
              <p className="text-muted-foreground mt-2">Congratulations on completing all the puzzles.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {currentPuzzle && (
            <div className="w-full flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setShowHint(s => !s)} disabled={!currentPuzzle.hint}>
                <Lightbulb className="mr-2 h-4 w-4" /> {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
              <Button variant="outline" onClick={() => setShowAnswer(s => !s)} disabled={!currentPuzzle.answer}>
                <Key className="mr-2 h-4 w-4" /> {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </Button>
              <Button onClick={handleNextPuzzle}>
                <SkipForward className="mr-2 h-4 w-4" /> Next Puzzle
              </Button>
            </div>
          )}
           <Button variant="link" onClick={handleResetProgress}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Progress and Start Over
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
