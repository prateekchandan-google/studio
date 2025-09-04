
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PuzzleManagementPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Puzzle Management
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create, edit, and organize puzzles for the treasure hunt.
        </p>
      </header>

      <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Puzzle management features coming soon!</p>
      </div>
    </div>
  );
}
