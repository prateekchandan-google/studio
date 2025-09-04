
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader, PlusCircle } from 'lucide-react';

const puzzleSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  hint: z.string().min(1, 'Hint is required.'),
  solution: z.string().min(1, 'Solution is required.'),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

export default function PuzzleManagementPage() {
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

  const onSubmit = async (data: PuzzleFormValues) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'puzzles'), data);
      toast({ title: 'Puzzle Created', description: `"${data.title}" has been successfully added.` });
      form.reset();
    } catch (error) {
      console.error('Failed to save puzzle', error);
      toast({ title: 'An Error Occurred', description: 'Could not save the puzzle. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header>
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Puzzle Management
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create puzzles for the treasure hunt.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-6 h-6"/>
            Create New Puzzle
          </CardTitle>
          <CardDescription>
            Fill out the form below to add a new puzzle to the game.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puzzle Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Silent Sentinel" {...field} />
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
                    <FormLabel>Puzzle Description (The Riddle)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="I have cities, but no houses..." {...field} />
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
                      <Input placeholder="What do you use to explore the world?" {...field} />
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
                      <Input placeholder="A map" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Saving...' : 'Create Puzzle'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
