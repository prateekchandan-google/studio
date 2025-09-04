"use client";

import { useState, useEffect } from 'react';
import { puzzles, teams } from '@/lib/data';
import type { Puzzle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, SkipForward, Timer, Send, Info } from 'lucide-react';

const HINT_TIME = 5 * 60; // 5 minutes in seconds
const SKIP_TIME = 10 * 60; // 10 minutes in seconds
const PUZZLE_DURATION = 15 * 60; // 15 minutes in seconds

export default function GamePage() {
  // For this demo, we'll hardcode to the first team.
  const [team, setTeam] = useState(teams[0]); 
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(puzzles[team.currentPuzzleIndex]);
  const [timeLeft, setTimeLeft] = useState(PUZZLE_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isPaused) return;

    if (timeLeft <= 0) {
      toast({
        title: "Time's Up!",
        description: "Moving to the next puzzle automatically.",
        variant: 'destructive',
      });
      // Handle skipping automatically
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, toast]);

  const handleHint = () => {
    setShowHint(true);
    setTeam(t => ({...t, score: t.score - 5}));
    toast({
      title: 'Hint Unlocked!',
      description: '5 points have been deducted.',
    });
  };
  
  const handleSkip = () => {
      const nextPuzzleIndex = (team.currentPuzzleIndex + 1) % puzzles.length;
      setTeam(t => ({...t, currentPuzzleIndex: nextPuzzleIndex}));
      setCurrentPuzzle(puzzles[nextPuzzleIndex]);
      setTimeLeft(PUZZLE_DURATION);
      setShowHint(false);
      toast({
          title: 'Puzzle Skipped',
          description: `No points awarded. On to the next challenge!`,
      });
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsPaused(true);
      toast({
          title: 'Submission Received!',
          description: 'Your answer is now under review. The timer has been paused.',
      });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canShowHint = timeLeft <= PUZZLE_DURATION - HINT_TIME;
  const canSkip = timeLeft <= PUZZLE_DURATION - SKIP_TIME;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-3xl">{currentPuzzle.title}</CardTitle>
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Timer className="h-6 w-6" />
                    <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
              <Progress value={(timeLeft / PUZZLE_DURATION) * 100} className="w-full mt-2" />
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg text-muted-foreground whitespace-pre-wrap">{currentPuzzle.description}</p>
              
              {showHint && (
                 <Alert className="mt-6 bg-accent/20 border-accent">
                    <Lightbulb className="h-4 w-4 text-accent-foreground" />
                    <AlertTitle className="font-bold text-accent-foreground">Hint</AlertTitle>
                    <AlertDescription className="text-accent-foreground/80">{currentPuzzle.hint}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleHint} disabled={!canShowHint || showHint}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {showHint ? 'Hint Revealed' : `Get Hint (-5 pts)`}
                </Button>
                <Button variant="secondary" onClick={handleSkip} disabled={!canSkip}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip Puzzle
                </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Submit Your Answer</CardTitle>
              <CardDescription>Once submitted, the timer will pause for review.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {isPaused && (
                         <Alert variant="default" className="bg-primary/10 border-primary/20">
                            <Info className="h-4 w-4 text-primary"/>
                            <AlertTitle className="text-primary font-bold">Under Review</AlertTitle>
                            <AlertDescription className="text-primary/80">
                                Your submission is being reviewed by an admin. The timer is paused.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="text-answer">Your reasoning</Label>
                        <Textarea id="text-answer" placeholder="Explain how you solved the riddle..." required disabled={isPaused}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image-answer">Supporting photo (optional)</Label>
                        <Input id="image-answer" type="file" accept="image/*" disabled={isPaused} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isPaused}>
                        <Send className="mr-2 h-4 w-4"/>
                        {isPaused ? 'Submitted for Review' : 'Submit Answer'}
                    </Button>
                </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
