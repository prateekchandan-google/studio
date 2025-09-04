
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X, Loader, Edit } from 'lucide-react';

export default function ProblemsPage() {
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleAddNewClick = () => {
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
                Puzzle Management
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Create and manage the challenges for the treasure hunt.
            </p>
        </div>
        {!isFormVisible && (
            <Button onClick={handleAddNewClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Puzzle
            </Button>
        )}
      </header>

      {isFormVisible && (
        <Card>
            <CardHeader>
                <CardTitle>Create New Puzzle</CardTitle>
                <CardDescription>
                    Fill out the details below to add a new challenge to the game.
                </CardDescription>
            </CardHeader>
            <form>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="e.g., The Merchant's Dilemma" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (The Puzzle)</Label>
                        <Textarea id="description" placeholder="A merchant can place 8 large boxes or 10 small boxes..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hint">Hint</Label>
                        <Textarea id="hint" placeholder="Think about a system of equations." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="solution">Solution</Label>
                        <Textarea id="solution" placeholder="The final answer to the puzzle." />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleCancel}>
                         <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Save Puzzle
                    </Button>
                </CardFooter>
            </form>
        </Card>
      )}
    </div>
  );
}
