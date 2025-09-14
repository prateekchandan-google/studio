
"use client";

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, collection, query, where, getDocs, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserPlus, Users, X, Copy, Check, ArrowRight, Bot, Loader, TimerOff, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Team, GameSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateTeamName } from '@/ai/flows/name-generator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EarlyBirdAlert } from '@/components/early-bird-alert';

const houseNames = ["Halwa", "Chamcham", "Jalebi", "Ladoo"] as const;

const registrationSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters.'),
  houseName: z.enum(houseNames, { required_error: 'Please select a house.' }),
  members: z.array(z.object({ name: z.string().min(1, 'Member name cannot be empty.') }))
    .min(3, 'A minimum of 3 members is required.')
    .max(7, 'A maximum of 7 members is allowed.'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function RegistrationPage() {
  const [secretCode, setSecretCode] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [newlyRegisteredTeam, setNewlyRegisteredTeam] = useState<Team | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      teamName: '',
      members: [{ name: '' }, { name: '' }, { name: '' }],
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  const handleGenerateName = async () => {
    const houseName = form.getValues('houseName');
    if (!houseName) {
        toast({
            title: "Select a house first!",
            description: "Please choose a house before generating a name.",
            variant: "destructive",
        });
        return;
    }
    setIsGeneratingName(true);
    toast({ title: "Generating team name...", description: "Please wait a moment." });
    
    try {
        const result = await generateTeamName({ houseName });
        if (result.teamName) {
            form.setValue('teamName', result.teamName);
            toast({ title: "Name Suggested!", description: `How about \"${result.teamName}\"?` });
        } else {
            toast({ title: "Could not generate name", description: "The AI was unable to suggest a name. Please try again.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Failed to generate team name", error);
        toast({ title: "An Error Occurred", description: "Failed to connect to the name generation service.", variant: "destructive" });
    } finally {
        setIsGeneratingName(false);
    }
  }

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    const teamId = `${data.houseName.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const teamsRef = collection(db, 'teams');
      
      const teamCountSnapshot = await getCountFromServer(teamsRef);
      const teamCount = teamCountSnapshot.data().count;
      
      const q = query(teamsRef, where("house", "==", data.houseName));
      const querySnapshot = await getDocs(q);
      const existingPathIds = querySnapshot.docs.map(doc => (doc.data() as Team).pathId).filter(id => id !== undefined);

      const allPaths = [1, 2, 3, 4, 5];
      const availablePaths = allPaths.filter(p => !existingPathIds.includes(p));

      let assignedPathId: number;
      if (availablePaths.length > 0) {
        assignedPathId = availablePaths[Math.floor(Math.random() * availablePaths.length)];
      } else {
        assignedPathId = allPaths[Math.floor(Math.random() * allPaths.length)];
      }
      
      let score = 0;
      let awardedBonusPoints = 0;
      let bonusMessage = "";

      if (teamCount < 3) {
          score = 10;
          awardedBonusPoints = 10;
          bonusMessage = "You're one of the first 3 teams to register! +10 bonus points for an immediate hint!";
      } else if (teamCount < 6) {
          score = 5;
          awardedBonusPoints = 5;
          bonusMessage = "You're one of the next 3 teams to register! +5 bonus points for a waited hint!";
      }
      
      const newTeam: Omit<Team, 'currentPuzzleStartTime' | 'gameStartTime'> = {
        id: teamId,
        name: data.teamName,
        house: data.houseName,
        members: data.members.map(m => m.name),
        score: score,
        riddlesSolved: 0,
        currentPuzzleIndex: 0,
        secretCode: teamId,
        pathId: assignedPathId,
      };
    
      await setDoc(doc(db, "teams", teamId), newTeam);
      
      if (awardedBonusPoints > 0) {
        toast({
            title: "Early Bird Bonus!",
            description: bonusMessage,
        });
      }

      setNewlyRegisteredTeam(newTeam as Team);
      setSecretCode(teamId);
    } catch (error) {
        console.error("Could not save team to Firestore", error);
        toast({
            title: "Registration Failed",
            description: "Could not save your team. Please try again.",
            variant: "destructive",
        })
    } finally {
        setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (secretCode) {
      navigator.clipboard.writeText(secretCode);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const proceedToGame = () => {
    if (newlyRegisteredTeam) {
      setIsContinuing(true);
      // The user who registered is the first player.
      localStorage.setItem('pathfinder-active-teamId', newlyRegisteredTeam.id);
      localStorage.setItem(`pathfinder-player-${newlyRegisteredTeam.id}`, newlyRegisteredTeam.members[0]);
      router.push(`/game/${newlyRegisteredTeam.id}`);
    }
  }

  if (gameSettings === null) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }

  if (secretCode) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">Registration Successful!</CardTitle>
                    <CardDescription>
                        Thank you for registering! Here is your secret code. Keep it safe!
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="bg-muted p-4 rounded-lg font-mono text-lg tracking-widest relative">
                        <span>{secretCode}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 right-2 -translate-y-1/2"
                            onClick={copyToClipboard}
                        >
                            {hasCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </Button>
                    </div>
                     <p className="text-sm text-muted-foreground mt-4">
                        Please note your game code. You can log in with this code. If the game has not started, please visit this page on Sept 24th, 2:00 PM to begin.
                    </p>
                </CardContent>
                <CardFooter>
                     <Button className="w-full" onClick={proceedToGame} disabled={isContinuing}>
                        {isContinuing ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Proceeding...
                            </>
                        ) : (
                            <>
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!gameSettings.isRegistrationOpen) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
              <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                  <TimerOff className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Registration Closed</CardTitle>
              <CardDescription>
                  We are no longer accepting new team registrations. Please contact the game master if you believe this is an error.
              </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8 px-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Register Your Team</CardTitle>
          <CardDescription>Assemble your team, choose your house, and get ready for an adventure!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <EarlyBirdAlert />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="houseName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>House Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select your house" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {houseNames.map(house => (
                            <SelectItem key={house} value={house}>{house}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                  control={form.control}
                  name="teamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="The Seekers..." {...field} disabled={isSubmitting || isGeneratingName} />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={handleGenerateName} disabled={isSubmitting || isGeneratingName}>
                           {isGeneratingName ? <Loader className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                           <span className="sr-only">Generate Name</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 mt-6">
                <Label>Team Members ({fields.length}/7)</Label>
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`members.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                           <FormControl>
                            <Input placeholder={`Member ${index + 1} Name/Alias`} {...field} disabled={isSubmitting}/>
                          </FormControl>
                          {fields.length > 3 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSubmitting}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                 {form.formState.errors.members && (fields.length < 3 || fields.length > 7) && (
                    <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.message}
                    </p>
                )}
                {fields.length < 7 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '' })} disabled={isSubmitting}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>
              <CardFooter className="p-0 pt-6">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                        </>
                    ) : (
                        <>
                            <Users className="mr-2 h-4 w-4" /> Register Team & Get Code
                        </>
                    )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    
