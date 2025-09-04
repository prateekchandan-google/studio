
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Puzzle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader, PlusCircle, Trash2, Edit, ChevronRight, X } from 'lucide-react';

const puzzleSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  hint: z.string().min(1, 'Hint is required.'),
  solution: z.string().min(1, 'Solution is required.'),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

export default function PuzzleManagementPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
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

  useEffect(() => {
    const puzzlesQuery = query(collection(db, 'puzzles'), orderBy('title', 'asc'));

    const unsubscribe = onSnapshot(puzzlesQuery, (snapshot) => {
      const puzzlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
      setPuzzles(puzzlesData);
      setIsLoading(false);
    }, (error) => {
      console.error('Failed to fetch puzzles from Firestore', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (editingPuzzle) {
      form.reset(editingPuzzle);
    } else {
      form.reset({ title: '', description: '', hint: '', solution: '' });
    }
  }, [editingPuzzle, form]);

  const onSubmit = async (data: PuzzleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingPuzzle) {
        const puzzleRef = doc(db, 'puzzles', editingPuzzle.id);
        await updateDoc(puzzleRef, data);
        toast({ title: 'Puzzle Updated', description: `"${data.title}" has been successfully updated.` });
      } else {
        await addDoc(collection(db, 'puzzles'), data);
        toast({ title: 'Puzzle Created', description: `"${data.title}" has been successfully added.` });
      }
      setEditingPuzzle(null);
    } catch (error) {
      console.error('Failed to save puzzle', error);
      toast({ title: 'An Error Occurred', description: 'Could not save the puzzle. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (puzzleId: string) => {
    try {
      await deleteDoc(doc(db, 'puzzles', puzzleId));
      toast({ title: 'Puzzle Deleted', description: 'The puzzle has been successfully removed.' });
    } catch (error) {
      console.error('Failed to delete puzzle', error);
      toast({ title: 'Deletion Failed', description: 'Could not delete the puzzle. Please try again.', variant: 'destructive' });
    }
  };

  const handleEdit = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingPuzzle(null);
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header>
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Puzzle Management
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create, edit, and manage puzzles for the treasure hunt.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingPuzzle ? <Edit className="w-6 h-6"/> : <PlusCircle className="w-6 h-6"/>}
            {editingPuzzle ? 'Edit Puzzle' : 'Create New Puzzle'}
          </CardTitle>
          <CardDescription>
            {editingPuzzle ? `You are currently editing "${editingPuzzle.title}".` : 'Fill out the form below to add a new puzzle to the game.'}
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
            <CardFooter className="flex gap-2 justify-end">
              {editingPuzzle && (
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel Edit
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : editingPuzzle ? (
                  <Edit className="mr-2 h-4 w-4" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Saving...' : editingPuzzle ? 'Save Changes' : 'Create Puzzle'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Puzzles</CardTitle>
          <CardDescription>
            Here are all the puzzles currently in the game.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader className="w-8 h-8 animate-spin text-primary"/>
                </div>
            ) : puzzles.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {puzzles.map(puzzle => (
                        <AccordionItem value={puzzle.id} key={puzzle.id}>
                            <AccordionTrigger className="font-headline text-lg hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                    <span>{puzzle.title}</span>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(puzzle); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the puzzle
                                                    "{puzzle.title}".
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(puzzle.id)}>
                                                    Yes, delete it
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 pt-2 text-base">
                               <p><strong className="font-semibold">Riddle:</strong> {puzzle.description}</p>
                               <p><strong className="font-semibold">Hint:</strong> {puzzle.hint}</p>
                               <p><strong className="font-semibold text-primary">Solution:</strong> {puzzle.solution}</p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <Alert>
                    <AlertTitle>No Puzzles Found</AlertTitle>
                    <AlertDescription>
                        There are no puzzles in the database. Use the form above to create one.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
