
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { Lightbulb, SkipForward, Timer, Send, Info, Frown, QrCode, Share2, Copy, Check, Loader, UserCircle, LogOut, Wrench } from 'lucide-react';
import QRCode from "react-qr-code";


const HINT_TIME = 5 * 60; // 5 minutes in seconds
const SKIP_TIME = 10 * 60; // 10 minutes in seconds
const PUZZLE_DURATION = 15 * 60; // 15 minutes in seconds

export default function GamePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  const [team, setTeam] = useState<Team | undefined>();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>();
  const [timeLeft, setTimeLeft] = useState(PUZZLE_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [puzzlesLoaded, setPuzzlesLoaded] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);

  const { toast } = useToast();

  const handleExitGame = () => {
    localStorage.removeItem('pathfinder-active-teamId');
    localStorage.removeItem(`pathfinder-player-${teamId}`);
    router.push('/');
  };
  
  useEffect(() => {
    const puzzlesQuery = query(collection(db, 'puzzles'), orderBy('title', 'asc'));
    const unsubscribePuzzles = onSnapshot(puzzlesQuery, (snapshot) => {
        const puzzlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
        setPuzzles(puzzlesData);
        setPuzzlesLoaded(true);
    }, (error) => {
      console.error("Error fetching puzzles: ", error);
      toast({
            title: "Error",
            description: "Could not load puzzle data.",
            variant: "destructive"
        });
      setPuzzlesLoaded(true);
    });
    
    return () => unsubscribePuzzles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!teamId) {
      setTeamLoaded(true);
      return;
    }
    
    setPlayerName(localStorage.getItem(`pathfinder-player-${teamId}`));

    const teamDocRef = doc(db, 'teams', teamId);
    const unsubscribeTeam = onSnapshot(teamDocRef, (doc) => {
      if (doc.exists()) {
        const teamData = { id: doc.id, ...doc.data() } as Team;
        setTeam(teamData);
        if (teamData.secretCode && typeof window !== 'undefined') {
            setLoginUrl(`${window.location.origin}/?secretCode=${encodeURIComponent(teamData.secretCode)}`);
        }
      } else {
        setTeam(undefined); // Team deleted or doesn't exist
        toast({
            title: "Team Not Found",
            description: "Your team may have been removed by an admin. You are being logged out.",
            variant: "destructive",
            duration: 5000,
        });
        handleExitGame();
      }
      setTeamLoaded(true);
    }, (error) => {
        console.error("Error fetching team:", error);
        toast({
            title: "Error",
            description: "Could not load team data. Please try again.",
            variant: "destructive"
        });
        handleExitGame();
    });

    return () => unsubscribeTeam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => {
    if(puzzlesLoaded && teamLoaded) {
        setIsLoading(false);
    }
  }, [puzzlesLoaded, teamLoaded])

  useEffect(() => {
    if (puzzles.length > 0 && team !== undefined) {
      setCurrentPuzzle(puzzles[team.currentPuzzleIndex]);
    }
  }, [team, puzzles]);


  useEffect(() => {
    if(!team || isPaused || isLoading) return;

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
  }, [timeLeft, isPaused, team, isLoading]);

  const handleHint = () => {
    if (!team) return;
    setShowHint(true);
    // In a real app, this score update would be an atomic operation on the server.
    // For now, we are not updating score on hints.
    toast({
      title: 'Hint Unlocked!',
      description: '5 points have been deducted.',
    });
  };
  
  const handleSkip = () => {
    if (!team || puzzles.length === 0) return;
      const nextPuzzleIndex = (team.currentPuzzleIndex + 1) % puzzles.length;
      // This should also be an atomic server update
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
      // Here you would create the submission object and save to firestore
      // including the playerName state
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = () => {
    if (team?.secretCode) {
      navigator.clipboard.writeText(team.secretCode);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };
  
  if (isLoading) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }


  if (!team) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-4 w-fit">
                    <Frown className="w-8 h-8 text-destructive" />
                </div>
              <CardTitle className="font-headline text-2xl">Team Not Found</CardTitle>
              <CardDescription>
                We couldn't find a team with that ID. Please check your URL or register a new team.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-4">
              <Button asChild className="w-full">
                <Link href="/">Try Login Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">Register a New Team</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
    );
  }

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-headline font-bold">Welcome, {team.name}!</h1>
        <p className="text-muted-foreground">House: {team.house} | Score: {team.score}</p>
      </div>
      <div className='flex items-center gap-4'>
        {playerName && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
            <UserCircle className="w-5 h-5"/>
            <span>Playing as {playerName}</span>
          </div>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Team Code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Join the Team!</DialogTitle>
              <DialogDescription>
                Share the secret code or QR code to let others join your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="secret-code-display">Your Team's Secret Code</Label>
                <div className="relative mt-1">
                  <Input id="secret-code-display" readOnly value={team.secretCode} className="pr-10 font-mono tracking-wider"/>
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
                <p className="text-sm text-muted-foreground">Or scan the QR code for instant login</p>
                <div className="bg-white p-4 rounded-lg">
                  {loginUrl && <QRCode value={loginUrl} size={180} />}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="sm" onClick={handleExitGame}>
          <LogOut className="mr-2 h-4 w-4" />
          Exit Game
        </Button>
      </div>
    </div>
  );

  if (puzzles.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        {renderHeader()}
        <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-accent/10 p-3 rounded-full mb-4 w-fit">
                    <Wrench className="w-8 h-8 text-accent" />
                </div>
              <CardTitle className="font-headline text-2xl">Game Not Ready</CardTitle>
              <CardDescription>
                The Treasure Hunt is not set up yet. An admin needs to add puzzles before the game can begin.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-4">
              <Button onClick={handleExitGame} className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Go to Homepage
              </Button>
              <p className="text-xs text-muted-foreground">Admins can add puzzles <Link href="/admin/puzzles" className="underline">here</Link>.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!currentPuzzle) {
     return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }

  const canShowHint = timeLeft <= PUZZLE_DURATION - HINT_TIME;
  const canSkip = timeLeft <= PUZZLE_DURATION - SKIP_TIME;

  return (
    <div className="container mx-auto py-8 px-4">
      {renderHeader()}
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
              <p className="text-lg text-muted-foreground whitespace-pre-wrap">{currentPuzzle.puzzle}</p>
              
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
