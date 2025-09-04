"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, Key, Users, UserCheck, Loader } from 'lucide-react';
import Link from 'next/link';

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
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    const activeTeamId = localStorage.getItem('pathfinder-active-teamId');
    if (activeTeamId) {
      router.replace(`/game/${activeTeamId}`);
    }
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      secretCode: '',
    },
  });

  const handleLogin = async (secretCode: string) => {
    setIsSubmitting(true);
    setError('');
    
    // The secret code is now the teamId
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
            const teamData = teamDoc.data() as Team;
            // The secret code is the ID, so if the doc exists, the code is valid.
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
  }, [searchParams, form, router]);

  const handleMemberSelectAndGo = () => {
    if (team && selectedMember) {
        localStorage.setItem(`pathfinder-player-${team.id}`, selectedMember);
        localStorage.setItem('pathfinder-active-teamId', team.id);
        router.push(`/game/${team.id}`);
    } else {
        setError("Please select a team member.");
    }
  }
  
  if (team) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
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
                        {team.members.map(member => (
                            <Button 
                                key={member}
                                variant={selectedMember === member ? "default" : "outline"}
                                onClick={() => setSelectedMember(member)}
                                className="w-full"
                            >
                                {member}
                            </Button>
                        ))}
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
    <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Start Game</CardTitle>
          <CardDescription>Enter your team's secret code to begin.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleLogin(data.secretCode))}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="secretCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Code</FormLabel>
                    <FormControl>
                      <Input placeholder="halwa-xxxxxx" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                    </>
                ) : (
                    <>
                        <LogIn className="mr-2 h-4 w-4" /> Enter Challenge
                    </>
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have a code?{' '}
                <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Register your team
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
