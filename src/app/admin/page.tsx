
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Puzzle, Users } from "lucide-react";
import Link from "next/link";

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
