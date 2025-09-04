
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Puzzle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, PlusCircle, Loader, X, Puzzle as PuzzleIcon } from 'lucide-react';

const puzzleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  hint: z.string().min(5, 'Hint must be at least 5 characters long.'),
  solution: z.string().min(1, 'Solution cannot be empty.'),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

export default function PuzzleManagementPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PuzzleFormValues>({
    resolver: zodResolver(puzzleSchema),
    defaultValues: { title: '', description: '', hint: '', solution: '' },
  });

  useEffect(() => {
    const puzzlesQuery = query(collection(db, 'puzzles'));
    const unsubscribe = onSnapshot(
      puzzlesQuery,
      (snapshot) => {
        const puzzlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
        setPuzzles(puzzlesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching puzzles: ", error);
        toast({ title: "Error", description: "Could not load puzzle data.", variant: "destructive" });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (editingPuzzle) {
      form.reset(editingPuzzle);
    } else {
      form.reset({ title: '', description: '', hint: '', solution: '' });
    }
  }, [editingPuzzle, form]);

  const handleEditClick = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingPuzzle(null);
  };

  const onSubmit = async (data: PuzzleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingPuzzle) {
        const puzzleRef = doc(db, 'puzzles', editingPuzzle.id);
        await updateDoc(puzzleRef, data);
        toast({ title: 'Puzzle Updated', description: `"${data.title}" has been successfully updated.` });
      } else {
        await addDoc(collection(db, 'puzzles'), data);
        toast({ title: 'Puzzle Created', description: `"${data.title}" has been added to the game.` });
      }
      setEditingPuzzle(null);
    } catch (error) {
      console.error('Failed to save puzzle', error);
      toast({ title: 'Save Failed', description: 'Could not save the puzzle. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (puzzleId: string) => {
    try {
      await deleteDoc(doc(db, 'puzzles', puzzleId));
      toast({ title: 'Puzzle Deleted', description: 'The puzzle has been successfully removed.' });
      if (editingPuzzle?.id === puzzleId) {
        setEditingPuzzle(null);
      }
    } catch (error) {
      console.error('Failed to delete puzzle', error);
      toast({ title: 'Deletion Failed', description: 'Could not delete the puzzle. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header>
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Puzzle Management
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create, edit, and manage the challenges for the treasure hunt.
        </p>
      </header>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingPuzzle ? <Edit className="w-6 h-6"/> : <PlusCircle className="w-6 h-6"/>}
                {editingPuzzle ? `Edit Puzzle: ${editingPuzzle.title}` : 'Create New Puzzle'}
              </CardTitle>
              <CardDescription>
                {editingPuzzle ? 'Modify the details for this puzzle below.' : 'Fill out the form to add a new puzzle to the game.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puzzle Title</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., The Merchant's Dilemma" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (The Puzzle/Riddle)</FormLabel>
                    <FormControl><Textarea {...field} placeholder="What has an eye, but cannot see?" /></FormControl>
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
                    <FormControl><Textarea {...field} placeholder="It's often used for sewing." /></FormControl>
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
                    <FormControl><Input {...field} placeholder="A needle" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {editingPuzzle && (
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : (editingPuzzle ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                {isSubmitting ? 'Saving...' : (editingPuzzle ? 'Save Changes' : 'Create Puzzle')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Puzzles</CardTitle>
          <CardDescription>A list of all puzzles currently in the game.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Loading puzzles...</span>
            </div>
          ) : puzzles.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {puzzles.map((puzzle) => (
                <AccordionItem value={puzzle.id} key={puzzle.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className='flex justify-between items-center w-full pr-4'>
                        <span className='font-headline text-lg'>{puzzle.title}</span>
                        <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditClick(puzzle); }}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Puzzle</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete Puzzle</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the puzzle "{puzzle.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(puzzle.id)}>Yes, delete it</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p><strong>Description:</strong> {puzzle.description}</p>
                    <p><strong>Hint:</strong> {puzzle.hint}</p>
                    <p><strong>Solution:</strong> <span className='font-mono bg-secondary px-2 py-1 rounded'>{puzzle.solution}</span></p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <PuzzleIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Puzzles Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Use the form above to create your first puzzle.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
