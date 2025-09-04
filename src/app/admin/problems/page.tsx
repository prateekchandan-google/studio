
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, X, Loader } from 'lucide-react';
import { Label } from '@/components/ui/label';


export default function ProblemsPage() {
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hint, setHint] = useState('');
  const [solution, setSolution] = useState('');
  const { toast } = useToast();


  const handleAddNewClick = () => {
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setTitle('');
    setDescription('');
    setHint('');
    setSolution('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !hint || !solution) {
      toast({
        title: 'Validation Error',
        description: 'Please fill out all fields.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    console.log("Simulating puzzle submission with data:", { title, description, hint, solution });

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
        title: 'Puzzle Created! (Simulated)',
        description: `The puzzle "${title}" has been successfully added.`,
    });
    setIsFormVisible(false);
    setIsSubmitting(false);
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
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Create New Puzzle</CardTitle>
                    <CardDescription>
                        Fill out the details below to add a new challenge to the game.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" placeholder="e.g., The Merchant's Dilemma" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="description">Description (The Puzzle)</Label>
                      <Textarea id="description" placeholder="A merchant can place 8 large boxes or 10 small boxes..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="hint">Hint</Label>
                      <Textarea id="hint" placeholder="Think about a system of equations." value={hint} onChange={(e) => setHint(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="solution">Solution</Label>
                      <Textarea id="solution" placeholder="The final answer to the puzzle." value={solution} onChange={(e) => setSolution(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <PlusCircle className="mr-2 h-4 w-4" />
                        )}
                        {isSubmitting ? 'Saving...' : 'Save Puzzle'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
      )}
    </div>
  );
}
