
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Puzzle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Loader, BookOpen, Pencil, Sparkles, GripVertical, View } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const puzzleSchema = z.object({
  title: z.string().min(3, 'Puzzle title must be at least 3 characters.'),
  puzzle: z.string().min(10, 'Puzzle description must be at least 10 characters.'),
  hint: z.string().optional(),
  answer: z.string().min(1, 'Answer cannot be empty.'),
  pathId: z.string().nullable(),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

const PuzzleCard = ({ puzzle, onOpen, isDetailedView, onEdit }: { puzzle: Puzzle; onOpen: () => void; isDetailedView: boolean, onEdit: () => void; }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: puzzle.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4 touch-none">
      <Card className="bg-muted/50 relative cursor-pointer" onClick={!isDetailedView ? onOpen : undefined}>
        <div {...attributes} {...listeners} className="absolute top-1/2 -translate-y-1/2 left-2 cursor-grab">
          <GripVertical className="text-muted-foreground" />
        </div>
        <CardHeader>
          <CardTitle className="text-base pl-6">{puzzle.title}</CardTitle>
        </CardHeader>
        {isDetailedView && (
          <CardContent className="space-y-3 pl-10 text-sm">
             <div>
                <h4 className="font-semibold text-muted-foreground">Puzzle</h4>
                <p className="whitespace-pre-wrap">{puzzle.puzzle}</p>
              </div>
              {puzzle.hint && (
                <div>
                    <h4 className="font-semibold text-muted-foreground">Hint</h4>
                    <p>{puzzle.hint}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-muted-foreground">Answer</h4>
                <p className="font-mono bg-secondary/50 p-1 rounded text-xs">{puzzle.answer}</p>
              </div>
          </CardContent>
        )}
        {isDetailedView && (
             <CardFooter className="pl-10 pb-4 justify-end">
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
};

const PuzzlePathColumn = ({ id, title, puzzles = [], onOpen, isDetailedView, onEdit }: { id: string; title: string; puzzles?: Puzzle[]; onOpen: (puzzle: Puzzle) => void; isDetailedView: boolean; onEdit: (puzzle: Puzzle) => void; }) => {
  return (
    <div className="bg-card p-4 rounded-lg w-full">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <SortableContext items={puzzles.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="min-h-[200px]">
          {puzzles.map(puzzle => (
            <PuzzleCard key={puzzle.id} puzzle={puzzle} onOpen={() => onOpen(puzzle)} isDetailedView={isDetailedView} onEdit={() => onEdit(puzzle)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default function PuzzleManagementPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewingPuzzle, setViewingPuzzle] = useState<Puzzle | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDetailedView, setIsDetailedView] = useState(false);
  const { toast } = useToast();

  const form = useForm<PuzzleFormValues>({
    resolver: zodResolver(puzzleSchema),
    defaultValues: { title: '', puzzle: '', hint: '', answer: '', pathId: null },
  });

  useEffect(() => {
    if (editingPuzzle) {
      form.reset({
        title: editingPuzzle.title,
        puzzle: editingPuzzle.puzzle,
        hint: editingPuzzle.hint,
        answer: editingPuzzle.answer,
        pathId: editingPuzzle.pathId ? editingPuzzle.pathId.toString() : null,
      });
    }
  }, [editingPuzzle, form]);

  useEffect(() => {
    const puzzlesQuery = query(collection(db, 'puzzles'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(puzzlesQuery, (snapshot) => {
      const puzzlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
      setPuzzles(puzzlesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to fetch puzzles:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const puzzlesByPath = useMemo(() => {
    const columns: { [key: string]: Puzzle[] } = {};
    // Initialize columns for each path
    for (let i = 1; i <= 5; i++) {
      columns[`path-${i}`] = [];
    };

    const defaultPathId = `path-1`
    puzzles.forEach(puzzle => {
      const pathId = puzzle.pathId ? `path-${puzzle.pathId}`.toLowerCase() : defaultPathId;
      if (columns[pathId]) {
        columns[pathId].push(puzzle);
      } else {
        columns[defaultPathId].push(puzzle);
      }
    });

    return columns;
  }, [puzzles]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    setPuzzles((puzzles) => {
      const activeIndex = puzzles.findIndex((p) => p.id === activeId);
      const overIndex = puzzles.findIndex((p) => p.id === overId);

      const activePuzzle = puzzles[activeIndex];
      const overPuzzle = puzzles[overIndex];

      if (activePuzzle.pathId !== overPuzzle.pathId) {
        const newPuzzles = [...puzzles];
        newPuzzles[activeIndex] = { ...activePuzzle, pathId: overPuzzle.pathId };
        return newPuzzles;
      }

      return puzzles;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = puzzles.findIndex(p => p.id === active.id);
      const newIndex = puzzles.findIndex(p => p.id === over.id);

      const activePuzzle = puzzles[oldIndex];
      const overPuzzle = puzzles[newIndex];

      const newPathId = overPuzzle.pathId;

      let updatedPuzzles = [...puzzles];
      updatedPuzzles.splice(oldIndex, 1);
      updatedPuzzles.splice(newIndex, 0, activePuzzle);

      const batch = writeBatch(db);
      let order = 0;
      const pathPuzzles = updatedPuzzles.filter(p => p.pathId === newPathId);
      pathPuzzles.forEach(puzzle => {
        const puzzleRef = doc(db, 'puzzles', puzzle.id);
        batch.update(puzzleRef, { pathId: newPathId, order: order++ });
      });

      try {
        await batch.commit();
        toast({ title: "Puzzles Updated", description: "Your puzzle paths have been saved." });
      } catch (error) {
        console.error("Failed to save puzzle order:", error);
        toast({ title: "Save Failed", description: "Could not save your changes. Please try again.", variant: 'destructive' });
      }
    }
  };

  const onSubmit = async (data: PuzzleFormValues) => {
    setIsSubmitting(true);
    try {
      const puzzleData = {
        ...data,
        pathId: data.pathId ? parseInt(data.pathId) : null,
      };
      if (editingPuzzle) {
        const puzzleRef = doc(db, 'puzzles', editingPuzzle.id);
        await updateDoc(puzzleRef, puzzleData);
        toast({ title: 'Puzzle Updated' });
        setEditingPuzzle(null);
      } else {
        await addDoc(collection(db, 'puzzles'), {
          ...data,
          pathId: data.pathId ? parseInt(data.pathId) : null,
          description: data.puzzle,
          order: puzzles.filter(p => !p.pathId).length,
        });
        toast({ title: 'Puzzle Added' });
        setShowAddForm(false);
      }
      form.reset();
    } catch (error) {
      console.error('Error saving puzzle:', error);
      toast({ title: 'Save Failed', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateTitle = async () => {
    const puzzleContent = form.getValues('puzzle');
    if (puzzleContent.length < 10) {
      toast({ title: 'Puzzle Too Short', description: 'Please write a longer puzzle to generate a title from.', variant: 'destructive' });
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/generate-puzzle-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzle: puzzleContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate title');
      }

      const { title } = await response.json();
      form.setValue('title', title, { shouldValidate: true });
      toast({ title: 'Title Generated!', description: 'A new title has been created based on your puzzle.' });

    } catch (error) {
      console.error('Error generating title:', error);
      toast({ title: 'Generation Failed', description: 'Could not generate a new title. Please try again.', variant: 'destructive' });
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const openViewDialog = (puzzle: Puzzle) => {
    setViewingPuzzle(puzzle);
    setIsViewDialogOpen(true);
  };

  const openEditForm = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setShowAddForm(true); // Open the form for editing
    setIsViewDialogOpen(false); // Close the view dialog if it was open
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">Puzzle Management</h1>
          <p className="mt-2 text-lg text-muted-foreground">Drag and drop puzzles to organize them into paths.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
                id="detailed-view"
                checked={isDetailedView}
                onCheckedChange={setIsDetailedView}
            />
            <Label htmlFor="detailed-view">Detailed View</Label>
          </div>
          <Button onClick={() => { setShowAddForm(!showAddForm); setEditingPuzzle(null); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {showAddForm && !editingPuzzle ? 'Cancel' : 'Add New Puzzle'}
          </Button>
        </div>
      </header>

      {(showAddForm || editingPuzzle) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPuzzle ? 'Edit Puzzle' : 'Add a New Puzzle'}</CardTitle>
            <CardDescription>{editingPuzzle ? 'Update the details of your puzzle.' : 'Fill out the form to create a new puzzle for the hunt.'}</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="puzzle" render={({ field }) => (<FormItem><FormLabel>Puzzle / Riddle</FormLabel><FormControl><Textarea placeholder="I have cities, but no houses..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Puzzle Title</FormLabel><div className="flex gap-2"><FormControl><Input placeholder="e.g., The Whispering Library" {...field} /></FormControl><Button type="button" onClick={handleGenerateTitle} disabled={isGeneratingTitle}>{isGeneratingTitle ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate</Button></div><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hint" render={({ field }) => (<FormItem><FormLabel>Hint (Optional)</FormLabel><FormControl><Input placeholder="Think about something you can hold..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="answer" render={({ field }) => (<FormItem><FormLabel>Answer</FormLabel><FormControl><Input placeholder="The solution to the puzzle" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
              <CardContent>
                <FormField
                  control={form.control}
                  name="pathId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Path</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a path" /></SelectTrigger></FormControl>
                        <SelectContent>{[1, 2, 3, 4, 5].map(i => (<SelectItem key={i} value={i.toString()}>{`Path ${i}`}</SelectItem>))}</SelectContent>
                      </Select>
                    </FormItem>)} />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setShowAddForm(false); setEditingPuzzle(null); }} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Save Puzzle</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map(i => (
            <PuzzlePathColumn key={i} id={`path-${i}`} title={`Path ${i}`} puzzles={puzzlesByPath[`path-${i}`]} onOpen={openViewDialog} isDetailedView={isDetailedView} onEdit={openEditForm} />
          ))}
        </div>
      </DndContext>

      {viewingPuzzle && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingPuzzle.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Puzzle</h4>
                <p>{viewingPuzzle.puzzle}</p>
              </div>
              <div>
                <h4 className="font-semibold">Answer</h4>
                <p>{viewingPuzzle.answer}</p>
              </div>
               {viewingPuzzle.hint && (
                    <div>
                        <h4 className="font-semibold">Hint</h4>
                        <p>{viewingPuzzle.hint}</p>
                    </div>
                )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Close</Button>
              </DialogClose>
              <Button onClick={() => openEditForm(viewingPuzzle)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
