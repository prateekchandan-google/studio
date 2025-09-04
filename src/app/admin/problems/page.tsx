
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// import { addDoc, collection } from 'firebase/firestore'; <-- REMOVED
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, X, Loader } from 'lucide-react';

const puzzleSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'A description (the puzzle itself) is required.'),
    hint: z.string().min(1, 'A hint is required.'),
    solution: z.string().min(1, 'A solution is required.'),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

export default function ProblemsPage() {
  const [isFormVisible, setIsFormVisible] = useState(true); // Default to true to show form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PuzzleFormValues>({
    resolver: zodResolver(puzzleSchema),
    defaultValues: {
      title: '',
      description: '',
      hint: '',
      solution: '',
    },
  });

  const handleAddNewClick = () => {
    form.reset();
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    form.reset();
  };

  const onSubmit = async (data: PuzzleFormValues) => {
    setIsSubmitting(true);
    console.log("Simulating puzzle submission with data:", data);

    // This is a temporary simulation to avoid the 504 error.
    // In a future step, we'll re-add the Firestore logic safely.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
        title: 'Puzzle Created! (Simulated)',
        description: `The puzzle "${data.title}" has been successfully added.`,
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
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Create New Puzzle</CardTitle>
                        <CardDescription>
                            Fill out the details below to add a new challenge to the game.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., The Merchant's Dilemma" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (The Puzzle)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="A merchant can place 8 large boxes or 10 small boxes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="hint"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hint</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Think about a system of equations." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="solution"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Solution</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="The final answer to the puzzle." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
            </Form>
        </Card>
      )}
    </div>
  );
}
