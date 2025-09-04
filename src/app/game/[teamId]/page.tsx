"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { puzzles } from '@/lib/data';
import type { Puzzle, Team } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, SkipForward, Timer, Send, Info, Frown, QrCode, Share2, Copy, Check } from 'lucide-react';
import QRCode from "react-qr-code";


const HINT_TIME = 5 * 60; // 5 minutes in seconds
const SKIP_TIME = 10 * 60; // 10 minutes in seconds
const PUZZLE_DURATION = 15 * 60; // 15 minutes in seconds

export default function GamePage({ params }: { params: { teamId: string } }) {
  const { teamId } = params;
  const [team, setTeam] = useState<Team | undefined>();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>();
  const [timeLeft, setTimeLeft] = useState(PUZZLE_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // In a real app, you'd fetch team data. For this demo, we use localStorage.
    try {
        const storedTeams: Team[] = JSON.parse(localStorage.getItem('treasure-hunt-teams') || '[]');
        const foundTeam = storedTeams.find(t => t.id.toLowerCase() === teamId.toLowerCase());
        if (foundTeam) {
            setTeam(foundTeam);
            setCurrentPuzzle(puzzles[foundTeam.currentPuzzleIndex]);
            const storedCode = localStorage.getItem(`team-secret-${teamId}`);
            if(storedCode) {
              setSecretCode(storedCode);
              setLoginUrl(`${window.location.origin}/?secretCode=${encodeURIComponent(storedCode)}`);
            }
        }
    } catch (error) {
        console.error("Failed to retrieve teams from localStorage", error);
    }
  }, [teamId]);

  useEffect(() => {
    if(!team) return;

    if (isPaused) return;

    if (timeLeft <= 0) {
      toast({
        title: "Time's Up!",
        description: "Moving to the next puzzle automatically.",
        variant: 'destructive',
      });
      handleSkip();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, toast, team]);

  const handleHint = () => {
    if (!team) return;
    setShowHint(true);
    setTeam(t => t ? ({...t, score: t.score - 5}) : undefined);
    toast({
      title: 'Hint Unlocked!',
      description: '5 points have been deducted.',
    });
  };
  
  const handleSkip = () => {
    if (!team) return;
      const nextPuzzleIndex = (team.currentPuzzleIndex + 1) % puzzles.length;
      setTeam(t => t ? ({...t, currentPuzzleIndex: nextPuzzleIndex}) : undefined);
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

  const copyToClipboard = () => {
    if (loginUrl) {
      navigator.clipboard.writeText(loginUrl);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  if (!team || !currentPuzzle) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-4 w-fit">
                    <Frown className="w-8 h-8 text-destructive" />
                </div>
              <CardTitle className="font-headline text-2xl">Team Not Found</CardTitle>
              <CardDescription>
                We couldn't find a team with that code. Please check your code and try again, or register a new team.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-4">
              <Button asChild className="w-full">
                <Link href="/">Try Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">Register a New Team</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
    );
  }

  const canShowHint = timeLeft <= PUZZLE_DURATION - HINT_TIME;
  const canSkip = timeLeft <= PUZZLE_DURATION - SKIP_TIME;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-headline font-bold">{team.name}</h1>
          <p className="text-muted-foreground">House: {team.house} | Score: {team.score}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Team Code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Join the Team!</DialogTitle>
              <DialogDescription>
                Use the secret code or scan the QR code to join your team's game.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="secret-code-display">Your Team's Login URL</Label>
                <div className="relative mt-1">
                  <Input id="secret-code-display" readOnly value={loginUrl} className="pr-10 font-mono tracking-wider"/>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                      onClick={copyToClipboard}
                  >
                      {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground">Or scan with your phone</p>
                  <div className="bg-white p-4 rounded-lg">
                    {loginUrl && <QRCode value={loginUrl} size={180} />}
                  </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

    