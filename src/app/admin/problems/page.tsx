
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Puzzle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader, Edit, Trash2 } from 'lucide-react';

const puzzleSchema = z.object({
  title: z.string().min(3, 'Puzzle title must be at least 3 characters.'),
  puzzle: z.string().min(10, 'Puzzle description must be at least 10 characters.'),
  hint: z.string().optional(),
  solution: z.string().min(1, 'Solution cannot be empty.'),
  pathId: z.string().nullable(),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

export default function ProblemsPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const { toast } = useToast();

  const form = useForm<PuzzleFormValues>({
    resolver: zodResolver(puzzleSchema),
    defaultValues: { title: '', puzzle: '', hint: '', solution: '', pathId: null },
  });

  useEffect(() => {
    const puzzlesQuery = query(collection(db, 'puzzles'));
    const unsubscribe = onSnapshot(puzzlesQuery, (snapshot) => {
      const puzzlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
      setPuzzles(puzzlesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to fetch puzzles:", error);
      setIsLoading(false);
      toast({
        title: "Error Loading Puzzles",
        description: "Could not fetch puzzle data from the database.",
        variant: "destructive"
      });
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (editingPuzzle) {
      form.reset({
        title: editingPuzzle.title,
        puzzle: editingPuzzle.puzzle,
        hint: editingPuzzle.hint,
        solution: editingPuzzle.solution,
        pathId: editingPuzzle.pathId ? String(editingPuzzle.pathId) : null,
      });
      setShowAddForm(true);
    } else {
      form.reset({ title: '', puzzle: '', hint: '', solution: '', pathId: null });
    }
  }, [editingPuzzle, form]);

  const handleAddNew = () => {
    setEditingPuzzle(null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingPuzzle(null);
    setShowAddForm(false);
  };

  const onSubmit = async (data: PuzzleFormValues) => {
    setIsSubmitting(true);
    try {
      const parsedPathId = data.pathId ? parseInt(data.pathId, 10) : null;
      
      const puzzleData = {
        ...data,
        pathId: parsedPathId,
      };

      if (editingPuzzle) {
        const puzzleRef = doc(db, 'puzzles', editingPuzzle.id);
        await updateDoc(puzzleRef, puzzleData);
        toast({ title: 'Puzzle Updated', description: 'The puzzle has been successfully updated.' });
      } else {
        const newPuzzleData = {
            ...puzzleData,
            order: puzzles.filter(p => p.pathId === parsedPathId).length,
        };
        await addDoc(collection(db, 'puzzles'), newPuzzleData);
        toast({ title: 'Puzzle Added', description: 'The new puzzle is now available.' });
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving puzzle:', error);
      toast({ title: 'Save Failed', description: 'Could not save the puzzle to the database.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (puzzleId: string) => {
    try {
      await deleteDoc(doc(db, 'puzzles', puzzleId));
      toast({ title: 'Puzzle Deleted', description: 'The puzzle has been removed.' });
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast({ title: 'Deletion Failed', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">Problem Management</h1>
          <p className="mt-2 text-lg text-muted-foreground">Create, view, and manage all puzzles.</p>
        </div>
        {!showAddForm && (
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Puzzle
          </Button>
        )}
      </header>

      {(showAddForm || editingPuzzle) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPuzzle ? 'Edit Puzzle' : 'Add a New Puzzle'}</CardTitle>
            <CardDescription>{editingPuzzle ? 'Update the details for this puzzle.' : 'Fill out the form to create a new puzzle.'}</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., The Silent Speaker" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="puzzle" render={({ field }) => (<FormItem><FormLabel>Puzzle/Riddle</FormLabel><FormControl><Textarea placeholder="I have cities, but no houses..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hint" render={({ field }) => (<FormItem><FormLabel>Hint (Optional)</FormLabel><FormControl><Input placeholder="Think about something you can hold..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="solution" render={({ field }) => (<FormItem><FormLabel>Solution</FormLabel><FormControl><Input placeholder="The final answer" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="pathId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Path</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a path" /></SelectTrigger></FormControl>
                        <SelectContent>{[1, 2, 3, 4, 5].map(i => (<SelectItem key={i} value={String(i)}>{`Path ${i}`}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : 'Save Puzzle'}</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Puzzles</CardTitle>
          <CardDescription>A list of all puzzles currently in the game.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Solution</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : puzzles.length > 0 ? (
                puzzles.map((puzzle) => (
                  <TableRow key={puzzle.id}>
                    <TableCell className="font-medium">{puzzle.title}</TableCell>
                    <TableCell>{puzzle.pathId ? `Path ${puzzle.pathId}` : 'Unassigned'}</TableCell>
                    <TableCell>{puzzle.solution}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingPuzzle(puzzle)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the puzzle "{puzzle.title}".</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(puzzle.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No puzzles found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
