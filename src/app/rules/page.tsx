
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Camera, Clock, HelpCircle, Lightbulb, Trophy, Target, MapPin } from "lucide-react";

const rules = [
    {
        icon: Target,
        title: "Objective",
        description: "Your team's goal is to solve a series of puzzles and riddles as quickly as possible. The team with the highest score at the end of the game wins!"
    },
     {
        icon: MapPin,
        title: "Location",
        description: "The entire treasure hunt is confined to the <strong>Ananta building</strong>. All clues, answers, and required actions will be found within the building's premises."
    },
    {
        icon: Clock,
        title: "Game Duration",
        description: "The entire treasure hunt is timed. Each team has exactly <strong>60 minutes</strong> to solve as many puzzles as they can. The main timer starts when the first team member logs in after the game is live."
    },
    {
        icon: Award,
        title: "Scoring System",
        description: "Points are awarded for correct solutions and deducted for using hints. A correct puzzle solution earns your team <strong>20 points</strong>."
    },
    {
        icon: Lightbulb,
        title: "Hints & Skips",
        description: "Hints are available to help you out. A standard hint is available after 5 minutes for a <strong>5-point penalty</strong>. An immediate hint can be used anytime for a <strong>10-point penalty</strong>. You can skip a puzzle after 10 minutes, but you will receive no points for it."
    },
    {
        icon: Camera,
        title: "Mandatory Selfie/Photo",
        description: "Every puzzle solution <strong>MUST be accompanied by a supporting photograph</strong>. This could be a selfie of your team at a location or a photo of the object that is the answer to the riddle. No photo, no points!"
    },
    {
        icon: Trophy,
        title: "Winning",
        description: "The team with the most points at the end of the 60 minutes wins. If there's a tie, the team that reached their final score first will be the winner. Good luck!"
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
                <h2 className="text-2xl font-bold font-headline">Fair Play</h2>
                <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                    This game is all about fun, teamwork, and a bit of friendly competition. Please respect the game, other teams, and the locations you might visit. No cheating, and may the best team win!
                </p>
            </div>
        </div>
    )
}
