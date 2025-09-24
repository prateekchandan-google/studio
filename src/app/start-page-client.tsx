

"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, GameSettings, TeamMember } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, Key, Users, UserCheck, Loader, Timer, UserPlus, Gift, Trophy, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EarlyBirdAlert } from '@/components/early-bird-alert';

const loginSchema = z.object({
  secretCode: z.string().min(1, 'Secret code cannot be empty.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function StartGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showStartTimerDialog, setShowStartTimerDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      secretCode: '',
    },
  });

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'game');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setGameSettings(doc.data() as GameSettings);
        } else {
            setGameSettings({ isStarted: false, isRegistrationOpen: false });
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkActiveSession = async () => {
      const activeTeamId = localStorage.getItem('pathfinder-active-teamId');
      if (activeTeamId) {
        const activePlayer = localStorage.getItem(`pathfinder-player-${activeTeamId}`);
        // If we have a player and a team, the session is fully active, go to game.
        if (activePlayer) {
          router.push(`/game/${activeTeamId}`);
          return; // Stop execution here to prevent flicker
        }

        // If we only have a team ID, it means they need to select a player.
        // Verify the team still exists before showing member selection.
        const teamDocRef = doc(db, "teams", activeTeamId);
        const teamDoc = await getDoc(teamDocRef);
        if (teamDoc.exists()) {
           setTeam({ id: teamDoc.id, ...teamDoc.data() } as Team);
        } else {
          // Team was deleted, clear local storage
          localStorage.removeItem('pathfinder-active-teamId');
          localStorage.removeItem(`pathfinder-player-${activeTeamId}`);
        }
      }
      setIsCheckingSession(false);
    };
    checkActiveSession();
  }, [router]);

  const handleLogin = async (secretCode: string) => {
    setIsSubmitting(true);
    setError('');
    
    // The secret code IS the team ID.
    const teamId = secretCode.trim();
    if (!teamId) {
        setError('Secret code cannot be empty.');
        setIsSubmitting(false);
        return;
    }

    try {
        const teamDocRef = doc(db, "teams", teamId);
        const teamDoc = await getDoc(teamDocRef);

        if (teamDoc.exists()) {
            const teamData = {id: teamDoc.id, ...teamDoc.data()} as Team;
            setTeam(teamData);
        } else {
            setError('Team not found. Please check your secret code.');
        }
    } catch (err) {
        console.error("Firestore error:", err);
        setError('An error occurred while trying to log in.');
    } finally {
        setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const codeFromQuery = searchParams.get('secretCode');
    if (codeFromQuery) {
        form.setValue('secretCode', codeFromQuery);
        handleLogin(codeFromQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, form]);

  const handleMemberSelectAndGo = async () => {
    if (team && selectedMember) {
        localStorage.setItem(`pathfinder-player-${team.id}`, selectedMember);
        localStorage.setItem('pathfinder-active-teamId', team.id);

        const isGameActive = gameSettings?.isStarted;
        const isFirstPlayer = !team.gameStartTime;

        if (isGameActive && isFirstPlayer) {
            // First player logs in after game has started - show the dialog to start timer
            setShowStartTimerDialog(true);
        } else {
            // Either game hasn't started, or timer is already running for the team
            router.push(`/game/${team.id}`);
        }
    } else {
        setError("Please select a team member.");
    }
  }

  const startTimerAndProceed = async () => {
      if (team) {
          const teamRef = doc(db, "teams", team.id);
          await updateDoc(teamRef, {
              gameStartTime: serverTimestamp(),
              currentPuzzleStartTime: serverTimestamp()
          });
          router.push(`/game/${team.id}`);
      }
  }

  if (isCheckingSession || gameSettings === null) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }
  
  if (team) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <AlertDialog open={showStartTimerDialog} onOpenChange={setShowStartTimerDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                            <Timer className="w-8 h-8 text-primary" />
                        </div>
                        <AlertDialogTitle className="font-headline text-2xl text-center">The Game Begins!</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            You are the first member of your team to log in. The 60-minute timer for your treasure hunt starts now. Good luck!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogAction onClick={startTimerAndProceed} className="w-full">
                        Let's Go!
                    </AlertDialogAction>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <UserCheck className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Welcome, {team.name}!</CardTitle>
                    <CardDescription>Who is playing right now?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {team.members.map((member: string | TeamMember) => {
                            const memberName = typeof member === 'string' ? member : member.name;
                            return (
                                <Button 
                                    key={memberName}
                                    variant={selectedMember === memberName ? "default" : "outline"}
                                    onClick={() => setSelectedMember(memberName)}
                                    className="w-full"
                                >
                                    {memberName}
                                </Button>
                            )
                        })}
                    </div>
                    {error && (
                        <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleMemberSelectAndGo} className="w-full" disabled={!selectedMember}>
                        Let's Go!
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
  }


  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md z-10">
        <CardHeader className="text-center">
            <div className="mx-auto bg-accent/20 p-4 rounded-full mb-4 w-fit border border-accent/50">
                <Trophy className="w-8 h-8 text-accent" />
            </div>
          <CardTitle className="font-headline text-2xl">The Hunt is Over!</CardTitle>
          <CardDescription>
            Thank you to all the teams who participated in the Google TV Treasure Hunt 2025. We hope you had a fantastic adventure!
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground">
                You can check out the final rankings on the scoreboard or solve the puzzles on your own in Self Play mode.
            </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button asChild className="w-full">
                <Link href="/scoreboard">View Final Scoreboard</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
                <Link href="/self-play">
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Enter Self Play Mode
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
