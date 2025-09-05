
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Puzzle, Users, Gamepad2, Timer } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { GameSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";

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
                setGameSettings({ isStarted: false });
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
                        Use this master switch to start or stop the game for all players.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center space-x-4">
                     <Switch
                        id="game-start-switch"
                        checked={gameSettings?.isStarted || false}
                        onCheckedChange={handleGameStartToggle}
                        aria-readonly
                    />
                    <Label htmlFor="game-start-switch" className="text-lg">
                        {gameSettings?.isStarted ? 'Game is Live' : 'Game is Stopped'}
                    </Label>
                </CardContent>
                {gameSettings?.isStarted && gameSettings.startTime && (
                     <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
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
