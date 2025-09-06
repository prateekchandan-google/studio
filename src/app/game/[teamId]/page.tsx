
"use client";

import { useState, useEffect, FormEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy, where, addDoc, updateDoc, writeBatch, serverTimestamp, getDoc, FieldValue, deleteField, increment, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Puzzle, Team, GameSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, SkipForward, Timer, Send, Info, Frown, QrCode, Share2, Copy, Check, Loader, UserCircle, LogOut, Sparkles, Trophy, Users, Camera, CircleUserRound, Replace, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import QRCode from "react-qr-code";
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const HINT_PENALTY = 5;
const IMMEDIATE_HINT_PENALTY = 10;
const SKIP_PENALTY = 0; // No points awarded, but no deduction
const PUZZLE_REWARD = 20;
const OVERALL_GAME_DURATION = 60 * 60; // 60 minutes in seconds
const HINT_DELAY = 5 * 60; // 5 minutes in seconds
const SKIP_DELAY = 10 * 60; // 10 minutes in seconds

export default function GamePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  const [team, setTeam] = useState<Team | undefined>();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);
  
  // Timer states
  const [overallTimeLeft, setOverallTimeLeft] = useState(OVERALL_GAME_DURATION);
  const [hintTimeLeft, setHintTimeLeft] = useState(HINT_DELAY);
  const [skipTimeLeft, setSkipTimeLeft] = useState(SKIP_DELAY);
  const [showLiveStartDialog, setShowLiveStartDialog] = useState(false);

  const prevSubmissionIdRef = useRef<string | null | undefined>();
  const prevPuzzleIndexRef = useRef<number | undefined>();
  const prevGameStartedRef = useRef<boolean | undefined>();


  // Camera States
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  const { toast } = useToast();

  const handleExitGame = async () => {
    if (playerName) {
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, {
            [`onlineMembers.${playerName}`]: deleteField()
        });
    }
    localStorage.removeItem('pathfinder-active-teamId');
    localStorage.removeItem(`pathfinder-player-${teamId}`);
    router.push('/');
  };
  
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'game');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            const newSettings = doc.data() as GameSettings;
            setGameSettings(newSettings);
        } else {
            setGameSettings({ isStarted: false });
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const gameJustStarted = prevGameStartedRef.current === false && gameSettings?.isStarted === true;
    if (gameJustStarted && team && !team.gameStartTime) {
      setShowLiveStartDialog(true);
    }
    prevGameStartedRef.current = gameSettings?.isStarted;
  }, [gameSettings, team]);


  const handleStartTimer = async () => {
      if (!team) return;
      const teamRef = doc(db, 'teams', team.id);
      await updateDoc(teamRef, {
          gameStartTime: serverTimestamp(),
          currentPuzzleStartTime: serverTimestamp(),
      });
      setShowLiveStartDialog(false);
  }

  // Master data fetching effect for team
  useEffect(() => {
    if (!teamId) {
      setIsLoading(false);
      return;
    }
  
    setPlayerName(localStorage.getItem(`pathfinder-player-${teamId}`));
  
    const teamDocRef = doc(db, 'teams', teamId);
  
    const unsubscribeTeam = onSnapshot(teamDocRef, (teamDoc) => {
      if (!teamDoc.exists()) {
        setTeam(undefined);
        toast({
          title: "Team Not Found",
          description: "Your team may have been removed. Logging out.",
          variant: "destructive",
          duration: 5000,
        });
        handleExitGame();
        setIsLoading(false);
        return;
      }
  
      const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;

       // Check for rejection/approval toasts
        if (prevSubmissionIdRef.current && !teamData.currentSubmissionId && prevPuzzleIndexRef.current === teamData.currentPuzzleIndex) {
            toast({
                title: 'Submission Rejected',
                description: "Your answer wasn't quite right. The timer is running. Try again!",
                variant: 'destructive',
            })
        }
        if (prevPuzzleIndexRef.current !== undefined && teamData.currentPuzzleIndex > prevPuzzleIndexRef.current) {
            toast({
                title: 'Solution Approved!',
                description: `+${PUZZLE_REWARD} points! On to the next challenge.`,
            });
        }
        
        prevSubmissionIdRef.current = teamData.currentSubmissionId;
        prevPuzzleIndexRef.current = teamData.currentPuzzleIndex;

      setTeam(teamData);
  
      // Update online players
      if (teamData.onlineMembers) {
        const now = Date.now();
        const online = Object.entries(teamData.onlineMembers)
          .filter(([_, timestamp]) => timestamp && (now - timestamp.toDate().getTime()) < 30000)
          .map(([name]) => name);
        setOnlinePlayers(online);
      }
  
      // Set login URL
      if (teamData.secretCode && typeof window !== 'undefined') {
        setLoginUrl(`${window.location.origin}/?secretCode=${encodeURIComponent(teamData.secretCode)}`);
      }
  
      setIsLoading(false);

    }, (error) => {
      console.error("Error fetching team:", error);
      toast({ title: "Error", description: "Could not load team data.", variant: "destructive" });
      handleExitGame();
      setIsLoading(false);
    });
  
    return () => {
        unsubscribeTeam();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, toast]);

  // Puzzle fetching effect, dependent on team
  useEffect(() => {
      if (team && team.pathId !== undefined) {
          const puzzlesQuery = query(
              collection(db, 'puzzles'),
              where('pathId', '==', team.pathId),
              orderBy('order', 'asc')
          );
          const unsubscribePuzzles = onSnapshot(puzzlesQuery, (puzzlesSnapshot) => {
              const puzzlesData = puzzlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
              setPuzzles(puzzlesData);
          }, (error) => {
              console.error("Error fetching puzzles:", error);
              toast({ title: "Error", description: "Could not load puzzle data.", variant: "destructive" });
          });
          return () => {
            unsubscribePuzzles();
          };
      } else {
          setPuzzles([]);
      }
  }, [team, toast]);

  
  useEffect(() => {
    if (!teamId || !playerName) return;

    const teamRef = doc(db, 'teams', teamId);
    
    updateDoc(teamRef, {
      [`onlineMembers.${playerName}`]: serverTimestamp()
    });
    
    const interval = setInterval(() => {
       updateDoc(teamRef, {
         [`onlineMembers.${playerName}`]: serverTimestamp()
       });
    }, 20000); 

    const handleBeforeUnload = () => {
       updateDoc(teamRef, {
         [`onlineMembers.${playerName}`]: deleteField()
       });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        getDoc(teamRef).then(docSnap => {
            if(docSnap.exists()){
                updateDoc(teamRef, {
                    [`onlineMembers.${playerName}`]: deleteField()
                });
            }
        })
    };

  }, [teamId, playerName]);

  useEffect(() => {
    if (puzzles.length > 0 && team !== undefined && team.currentPuzzleIndex < puzzles.length) {
      const puzzleIndex = team.currentPuzzleIndex;
      setCurrentPuzzle(puzzles[puzzleIndex]);
    } else {
      setCurrentPuzzle(undefined);
    }
  }, [team, puzzles]);


  useEffect(() => {
    const isPaused = !!team?.currentSubmissionId;
    if(!team || isPaused || isLoading || !gameSettings?.isStarted || !team.gameStartTime || (team.currentPuzzleIndex >= puzzles.length && puzzles.length > 0)) return;

    const timer = setInterval(() => {
        // Overall Game Timer
        if (team.gameStartTime) {
            const gameStartTime = team.gameStartTime.toDate().getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - gameStartTime) / 1000);
            const newOverallTimeLeft = OVERALL_GAME_DURATION - elapsed;
            setOverallTimeLeft(newOverallTimeLeft > 0 ? newOverallTimeLeft : 0);
        }
        
        // Per-Puzzle Timer for Hints/Skips
        if (team.currentPuzzleStartTime) {
            const puzzleStartTime = team.currentPuzzleStartTime.toDate().getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - puzzleStartTime) / 1000);

            const newHintTimeLeft = HINT_DELAY - elapsed;
            setHintTimeLeft(newHintTimeLeft > 0 ? newHintTimeLeft : 0);

            const newSkipTimeLeft = SKIP_DELAY - elapsed;
            setSkipTimeLeft(newSkipTimeLeft > 0 ? newSkipTimeLeft : 0);
        }
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, isLoading, puzzles, gameSettings]);
  
  // Camera Effect Hook
  useEffect(() => {
    let localStream: MediaStream | null = null;
  
    async function setupCamera() {
      if (isCameraDialogOpen) {
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
          localStream = cameraStream;
          setStream(cameraStream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = cameraStream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this app.',
          });
        }
      }
    }

    setupCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraDialogOpen]);
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUri);
    }
  };

  const handleUsePhoto = () => {
    setIsCameraDialogOpen(false);
    // capturedImage is already set
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };
  

  const handleHint = async () => {
    if (!team || !currentPuzzle) return;
    const teamRef = doc(db, 'teams', team.id);
    await updateDoc(teamRef, { 
        score: increment(-HINT_PENALTY),
        revealedHints: arrayUnion(currentPuzzle.id)
    });
    toast({
      title: 'Hint Unlocked!',
      description: `${HINT_PENALTY} points have been deducted.`,
    });
  };

  const handleImmediateHint = async () => {
    if (!team || !currentPuzzle) return;
    const teamRef = doc(db, 'teams', team.id);
    await updateDoc(teamRef, { 
        score: increment(-IMMEDIATE_HINT_PENALTY),
        revealedHints: arrayUnion(currentPuzzle.id)
    });
    toast({
      title: 'Hint Unlocked!',
      description: `${IMMEDIATE_HINT_PENALTY} points have been deducted.`,
    });
  };
  
  const handleSkip = async () => {
    if (!team || puzzles.length === 0) return;
      const nextPuzzleIndex = team.currentPuzzleIndex + 1;
      
      const batch = writeBatch(db);
      const teamRef = doc(db, 'teams', team.id);
      batch.update(teamRef, {
          currentPuzzleIndex: nextPuzzleIndex,
          score: team.score - SKIP_PENALTY,
          currentSubmissionId: null,
          currentPuzzleStartTime: serverTimestamp(),
      });

      try {
        await batch.commit();

        if (nextPuzzleIndex >= puzzles.length) {
            toast({ title: 'Path Completed!', description: "You've skipped the final puzzle and found the treasure!" });
        } else {
          toast({
              title: 'Puzzle Skipped',
              description: `On to the next challenge!`,
          });
        }
      } catch (error) {
         console.error("Failed to skip puzzle", error);
         toast({ title: 'Error', description: 'Could not skip puzzle. Please try again.', variant: 'destructive'});
      }
  };

  const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!team || !currentPuzzle) return;
    
    if (!playerName) {
        toast({
            title: 'Cannot Submit',
            description: 'Player name not found. Please try logging in again.',
            variant: 'destructive',
        });
        return;
    }

    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);
    const imageFile = formData.get('image-answer') as File;

    if (!capturedImage && (!imageFile || imageFile.size === 0)) {
        toast({
            title: 'Image Required',
            description: 'You must provide a photo with your submission.',
            variant: 'destructive',
        });
        return;
    }

    setIsSubmitting(true);

    try {
      const textSubmission = formData.get('text-answer') as string;

      const submissionData: any = {
        teamId: team.id,
        teamName: team.name,
        puzzleId: currentPuzzle.id,
        puzzleTitle: currentPuzzle.title,
        textSubmission,
        status: 'pending',
        timestamp: serverTimestamp(),
        submittedBy: playerName,
      };
      
      if (capturedImage) {
        submissionData.imageSubmissionDataUri = capturedImage;
      } else if (imageFile && imageFile.size > 0) {
        submissionData.imageSubmissionDataUri = await fileToDataUri(imageFile);
      }

      const submissionDocRef = await addDoc(collection(db, 'submissions'), submissionData);
      await updateDoc(doc(db, 'teams', team.id), { currentSubmissionId: submissionDocRef.id });

      formEl.reset();
      setCapturedImage(null);
      toast({
        title: 'Submission Received!',
        description: 'Your answer is now under review. The timer has been paused.',
      });

    } catch (error) {
      console.error("Submission failed:", error);
      toast({
        title: 'Submission Failed',
        description: 'Could not submit your answer. Please check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
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
            </CardFooter>
          </Card>
        </div>
    );
  }
  
  const isPaused = !!team.currentSubmissionId;

  const renderHeader = () => (
    <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-headline font-bold">Welcome, {team.name}!</h1>
        <p className="text-muted-foreground">House: {team.house} | Score: {team.score}</p>
         <div className="flex items-center gap-2 mt-2 text-sm text-green-500 font-medium">
            <Users className="w-4 h-4"/>
            <span>Online: {onlinePlayers.join(', ')}</span>
        </div>
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
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Exit Game
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to exit?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Make sure you have saved your secret code before you leave. You will need it to log back in.
                        <div className="bg-muted p-3 rounded-lg font-mono text-center my-4">{team.secretCode}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Stay</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExitGame}>Exit Game</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
  
  if (!gameSettings?.isStarted || !team.gameStartTime) {
    return (
      <div className="container mx-auto py-8 px-4">
        {renderHeader()}
        <AlertDialog open={showLiveStartDialog} onOpenChange={setShowLiveStartDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <Timer className="w-8 h-8 text-primary" />
                    </div>
                    <AlertDialogTitle className="font-headline text-2xl text-center">The Game Begins!</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        The admin has started the game. The 60-minute timer for your treasure hunt starts now. Good luck!
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction onClick={handleStartTimer} className="w-full">
                    Let's Go!
                </AlertDialogAction>
            </AlertDialogContent>
        </AlertDialog>

        <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-accent/10 p-3 rounded-full mb-4 w-fit">
                    <Timer className="w-8 h-8 text-accent" />
                </div>
              <CardTitle className="font-headline text-2xl">Game Has Not Started Yet</CardTitle>
              <CardDescription>
                The game has not started yet, wait till 10th September Wednesday 2:00 PM. If the admin has started the game, please wait a moment.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (overallTimeLeft <= 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        {renderHeader()}
        <div className="flex justify-center items-center text-center min-h-[calc(100vh-20rem)]">
          <Card className="w-full max-w-lg z-10 bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto bg-destructive/20 p-4 rounded-full mb-4 w-fit border-2 border-destructive/50">
                <Timer className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle className="font-headline text-4xl">Time's Up!</CardTitle>
              <CardDescription className="text-lg">
                The hunt has concluded. Let's see how you did.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl">Your final score is:</p>
              <p className="text-6xl font-bold text-primary my-4">{team.score}</p>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-semibold mb-2">Your Path Summary</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {puzzles.map((puzzle, index) => (
                    <div
                      key={puzzle.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <span className="font-medium">{puzzle.title}</span>
                      {index < team.currentPuzzleIndex ? (
                        <span className="flex items-center gap-1.5 text-sm text-green-500">
                          <CheckCircle2 className="w-4 h-4" /> Solved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-destructive">
                          <XCircle className="w-4 h-4" /> Not Solved
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button asChild className="w-full" size="lg">
                <Link href="/scoreboard">View Scoreboard</Link>
              </Button>
              <Button variant="ghost" onClick={handleExitGame}>
                Exit Game
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }
  
  if (team.pathId === undefined || (team.currentPuzzleIndex >= puzzles.length && puzzles.length > 0)) {
    return (
      <div className="container mx-auto py-8 px-4 relative overflow-hidden">
        {renderHeader()}
        <div className="flex justify-center items-center text-center min-h-[calc(100vh-20rem)]">
           <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute animate-pulse text-yellow-400"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3 + 1}rem`,
                    height: `${Math.random() * 3 + 1}rem`,
                    animationDuration: `${Math.random() * 2 + 1}s`,
                    animationDelay: `${Math.random()}s`,
                  }}
                />
              ))}
            </div>
          <Card className="w-full max-w-lg z-10 bg-background/80 backdrop-blur-sm">
              <CardHeader>
                <div className="mx-auto bg-yellow-400/20 p-4 rounded-full mb-4 w-fit border-2 border-yellow-400/50">
                    <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
              <CardTitle className="font-headline text-4xl">Congratulations, {team.name}!</CardTitle>
              <CardDescription className="text-lg">
                You've solved all the puzzles and found the treasure!
              </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-xl">Your final score is:</p>
                <p className="text-6xl font-bold text-primary my-4">{team.score}</p>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button asChild className="w-full" size="lg">
                <Link href="/scoreboard">View Scoreboard</Link>
              </Button>
               <Button variant="ghost" onClick={handleExitGame}>
                 Exit Game
               </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentPuzzle) {
     return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }
  
  const hasRevealedHint = team.revealedHints?.includes(currentPuzzle.id);
  const canShowHint = hintTimeLeft <= 0;
  const canSkip = skipTimeLeft <= 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {renderHeader()}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline text-3xl">{currentPuzzle.title}</CardTitle>
                    <CardDescription className="mt-2 text-base font-semibold">
                        Puzzle {team.currentPuzzleIndex + 1} / {puzzles.length}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Timer className="h-6 w-6" />
                    <span>{isPaused ? "Paused" : formatTime(overallTimeLeft)}</span>
                </div>
              </div>
               <Progress value={(overallTimeLeft / OVERALL_GAME_DURATION) * 100} className="w-full mt-4" />
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg text-muted-foreground whitespace-pre-wrap">{currentPuzzle.puzzle}</p>
              
              {hasRevealedHint && currentPuzzle.hint && (
                 <Alert className="mt-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-300">Hint</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-200">{currentPuzzle.hint}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleImmediateHint} disabled={hasRevealedHint || !currentPuzzle.hint || isPaused}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get Hint Immediately (-{IMMEDIATE_HINT_PENALTY} pts)
                </Button>
                <Button variant="outline" onClick={handleHint} disabled={!canShowHint || hasRevealedHint || !currentPuzzle.hint || isPaused}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {hasRevealedHint ? 'Hint Revealed' : canShowHint ? `Get Hint (-${HINT_PENALTY} pts)` : `Hint in ${formatTime(hintTimeLeft)}`}
                </Button>
                <Button variant="secondary" onClick={handleSkip} disabled={!canSkip || isPaused}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    {canSkip ? 'Skip Puzzle' : `Skip in ${formatTime(skipTimeLeft)}`}
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
                        <Textarea id="text-answer" name="text-answer" placeholder="Explain how you solved the riddle..." required disabled={isPaused || isSubmitting}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image-answer">
                            Supporting photo <span className="text-destructive">*Required</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input id="image-answer" name="image-answer" type="file" accept="image/*" required disabled={isPaused || isSubmitting || !!capturedImage} />
                             <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" disabled={isPaused || isSubmitting}>
                                        <Camera />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Take a Photo</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-col items-center gap-4">
                                        {capturedImage ? (
                                            <Image src={capturedImage} alt="Captured" width={400} height={300} className="rounded-md" />
                                        ) : (
                                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                        )}
                                        {!hasCameraPermission && hasCameraPermission !== null && (
                                            <Alert variant="destructive">
                                                <CircleUserRound className="h-4 w-4" />
                                                <AlertTitle>Camera Permission Needed</AlertTitle>
                                                <AlertDescription>
                                                    Please allow camera access in your browser to take a photo.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                     <DialogFooter className="mt-4">
                                        {capturedImage ? (
                                            <>
                                                <Button variant="outline" onClick={handleRetake}>
                                                    <Replace className="mr-2 h-4 w-4" />
                                                    Retake
                                                </Button>
                                                <Button onClick={handleUsePhoto}>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Use Photo
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="ghost">Cancel</Button>
                                                </DialogClose>
                                                <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                                                    <Camera className="mr-2 h-4 w-4" />
                                                    Capture
                                                </Button>
                                            </>
                                        )}
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {capturedImage && (
                            <div className="relative mt-2 border rounded-md p-2">
                                <p className="text-sm font-medium mb-2">Photo to submit:</p>
                                <Image src={capturedImage} alt="Photo to submit" width={200} height={150} className="rounded-md" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => setCapturedImage(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isPaused || isSubmitting}>
                        {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        {isPaused ? 'Submitted for Review' : isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

