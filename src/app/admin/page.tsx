
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Puzzle, Users, Gamepad2, Timer, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { GameSettings } from "@/lib/types";

const adminSections = [
    {
        href: '/admin/submission',
        icon: CheckSquare,
        title: 'Submissions',
        description: 'Review and approve/reject team submissions.'
    },
    {
        href: '/admin/teams',
        icon: Users,
        title: 'Team Management',
        description: 'View, edit, and manage all registered teams.'
    },
    {
        href: '/admin/puzzles',
        icon: Puzzle,
        title: 'Puzzle Management',
        description: 'Create, edit, and organize puzzles and paths.'
    }
]

export default function AdminHomePage() {
    const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const settingsRef = doc(db, 'settings', 'game');
        const unsubscribe = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                setGameSettings(doc.data() as GameSettings);
            } else {
                setGameSettings({ isStarted: false, isRegistrationOpen: false, allowExit: false });
            }
        });
        return () => unsubscribe();
    }, []);

    const handleGameStartToggle = async (isStarted: boolean) => {
        const settingsRef = doc(db, 'settings', 'game');
        try {
            const updateData: any = { isStarted };
            if (isStarted && !gameSettings?.startTime) {
                updateData.startTime = serverTimestamp();
            }
            await updateDoc(settingsRef, updateData);
            toast({
                title: isStarted ? "Game Started!" : "Game Stopped!",
                description: isStarted ? "All players can now begin the hunt." : "Players will now be paused.",
            });
        } catch (error) {
            console.error("Failed to update game status:", error);
            toast({ title: 'Error', description: 'Could not update game status.', variant: 'destructive' });
        }
    };

    const handleRegistrationToggle = async (isOpen: boolean) => {
        const settingsRef = doc(db, 'settings', 'game');
        try {
            await updateDoc(settingsRef, { isRegistrationOpen: isOpen });
            toast({
                title: isOpen ? "Registration Opened" : "Registration Closed",
                description: isOpen ? "Users can now register new teams." : "Users can no longer register.",
            });
        } catch (error) {
            console.error("Failed to update registration status:", error);
            toast({ title: 'Error', description: 'Could not update registration status.', variant: 'destructive' });
        }
    };

    const handleAllowExitToggle = async (allowExit: boolean) => {
        const settingsRef = doc(db, 'settings', 'game');
        try {
            await updateDoc(settingsRef, { allowExit });
            toast({
                title: allowExit ? "Game Exit Enabled" : "Game Exit Disabled",
                description: allowExit ? "Players can now exit the game." : "Players can no longer exit the game.",
            });
        } catch (error) {
            console.error("Failed to update exit status:", error);
            toast({ title: 'Error', description: 'Could not update exit status.', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font.headline font-bold tracking-tight lg:text-5xl">
                    Admin Home
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Welcome, Admin! You can manage submissions, puzzles, and teams from here.
                </p>
            </header>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gamepad2 className="w-6 h-6" /> Game Control
                    </CardTitle>
                    <CardDescription>
                        Use these master switches to control the game state.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Switch
                            id="game-start-switch"
                            checked={gameSettings?.isStarted || false}
                            onCheckedChange={handleGameStartToggle}
                            aria-readonly
                        />
                        <Label htmlFor="game-start-switch" className="text-lg flex-grow">
                            {gameSettings?.isStarted ? 'Game is Live' : 'Game is Stopped'}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Switch
                            id="registration-switch"
                            checked={gameSettings?.isRegistrationOpen || false}
                            onCheckedChange={handleRegistrationToggle}
                            aria-readonly
                        />
                        <Label htmlFor="registration-switch" className="text-lg flex-grow">
                            {gameSettings?.isRegistrationOpen ? 'Registration is Open' : 'Registration is Closed'}
                        </Label>
                    </div>
                     <div className="flex items-center space-x-4">
                        <Switch
                            id="allow-exit-switch"
                            checked={gameSettings?.allowExit || false}
                            onCheckedChange={handleAllowExitToggle}
                            aria-readonly
                        />
                        <Label htmlFor="allow-exit-switch" className="text-lg flex-grow">
                           {gameSettings?.allowExit ? 'Player Exit is Enabled' : 'Player Exit is Disabled'}
                        </Label>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 p-3 text-warning-foreground">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold">Enable player exit for testing only</p>
                            <p className="text-sm text-warning-foreground/80">Allowing players to exit can disrupt the game flow. Only enable this for debugging or testing purposes.</p>
                        </div>
                    </div>
                </CardContent>
                {gameSettings?.isStarted && gameSettings.startTime && (
                     <CardContent className="flex items-center gap-2 text-sm text-muted-foreground pt-0">
                        <Timer className="w-4 h-4" />
                        <span>Game started at: {new Date(gameSettings.startTime.toDate()).toLocaleString()}</span>
                    </CardContent>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminSections.map(section => (
                    <Link href={section.href} key={section.href}>
                         <Card className="hover:border-primary hover:shadow-lg transition-all h-full">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <section.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline">{section.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{section.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
