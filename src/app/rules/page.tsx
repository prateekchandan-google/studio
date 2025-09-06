
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Camera, Clock, Lightbulb, Trophy, Target, MapPin } from "lucide-react";

const rules = [
    {
        icon: Target,
        title: "The Goal",
        description: "Your objective is to solve a series of puzzles as quickly as possible within the <strong>60-minute</strong> time limit. The team with the most points at the end wins! In case of a tie, the team that finished first wins."
    },
    {
        icon: MapPin,
        title: "Location",
        description: "The entire treasure hunt is confined to the <strong>Ananta building</strong>. All clues, answers, and required actions will be found within the building's premises."
    },
    {
        icon: Award,
        title: "Scoring System",
        description: "A correct puzzle solution earns your team <strong>20 points</strong>. Points are deducted for using hints, so use them wisely!"
    },
    {
        icon: Lightbulb,
        title: "Hints & Skips",
        description: "A standard hint is available after 5 minutes for a <strong>5-point penalty</strong>. An immediate hint costs <strong>10 points</strong>. You can skip a puzzle after 10 minutes for no points."
    },
    {
        icon: Camera,
        title: "Mandatory Photo",
        description: "Every puzzle solution <strong>MUST be accompanied by a supporting photograph</strong>. This could be a selfie of your team or a photo of the answer. No photo, no points!"
    },
    {
        icon: Trophy,
        title: "Fair Play",
        description: "This game is about fun and teamwork. Please respect other teams and the location. No cheating, and may the best team win!"
    }
];

export default function RulesPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl text-foreground">
                    Game Rules & Guidelines
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Read carefully to maximize your score and lead your team to victory!
                </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader className="flex-row gap-4 items-center">
                             <div className="p-3 bg-primary/10 rounded-lg">
                                <rule.icon className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="font-headline text-2xl">{rule.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: rule.description }} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-12 text-center">
                <h2 className="text-2xl font-bold font-headline">Good Luck!</h2>
                <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                   Now that you know the rules, it's time to get in the game. Assemble your team and prepare for an adventure!
                </p>
            </div>
        </div>
    )
}
