

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
import { PlusCircle, Loader, BookOpen, Pencil, Sparkles, GripVertical, View, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

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
      <Card className="bg-muted/50 relative" onClick={onOpen}>
        <button {...attributes} {...listeners} className="absolute top-1/2 -translate-y-1/2 left-2 cursor-grab p-2">
          <GripVertical className="text-muted-foreground" />
           <span className="sr-only">Drag to reorder puzzle</span>
        </button>
        <CardHeader className="pl-10">
          <CardTitle className="text-base">{puzzle.title}</CardTitle>
        </CardHeader>
        {isDetailedView && (
          <CardContent className="space-y-3 pl-10 text-sm">
            <Collapsible>
              <CollapsibleTrigger asChild>
                 <Button variant="ghost" size="sm" className="w-full justify-between px-2">
                    <span className="font-semibold text-muted-foreground">Puzzle</span>
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="whitespace-pre-wrap p-2">{puzzle.puzzle}</p>
              </CollapsibleContent>
            </Collapsible>
             {puzzle.hint && (
                <Collapsible>
                    <CollapsibleTrigger asChild>
                         <Button variant="ghost" size="sm" className="w-full justify-between px-2">
                            <span className="font-semibold text-muted-foreground">Hint</span>
                            <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <p className="whitespace-pre-wrap p-2">{puzzle.hint}</p>
                    </CollapsibleContent>
                </Collapsible>
            )}
            <div>
                <h4 className="font-semibold text-muted-foreground pl-2">Answer</h4>
                <p className="font-mono bg-secondary/50 p-1 rounded text-xs mt-1">{puzzle.answer}</p>
            </div>
          </CardContent>
        )}
        {isDetailedView && (
             <CardFooter className="pl-10 pb-4 justify-end">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
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
    <div id={id} className="bg-card p-4 rounded-lg w-full border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <Badge variant="secondary">{puzzles.length} Puzzles</Badge>
      </div>
      <SortableContext items={puzzles.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="min-h-[200px] space-y-2">
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [viewingPuzzle, setViewingPuzzle] = useState<Puzzle | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDetailedView, setIsDetailedView] = useState(false);
  const { toast } = useToast();

  const form = useForm<PuzzleFormValues>({
    resolver: zodResolver(puzzleSchema),
    defaultValues: { title: '', puzzle: '', hint: '', answer: '', pathId: '1' },
  });

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
    const columns: Record<string, Puzzle[]> = {
        'path-1': [],
        'path-2': [],
        'path-3': [],
        'path-4': [],
        'path-5': [],
    };
    
    puzzles.forEach(puzzle => {
      const pathKey = `path-${puzzle.pathId || 1}`;
      if (columns[pathKey]) {
        columns[pathKey].push(puzzle);
      }
    });

    return columns;
  }, [puzzles]);

  const findContainer = (id: UniqueIdentifier) => {
    if (id in puzzlesByPath) {
      return id;
    }
    return Object.keys(puzzlesByPath).find((key) => puzzlesByPath[key].some(p => p.id === id));
  };


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id;
    const overId = over.id;
  
    if (activeId === overId) return;
  
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
  
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
  
    setPuzzles((prev) => {
      const activeIndex = prev.findIndex((p) => p.id === activeId);
      const overIndex = prev.findIndex((p) => p.id === overId);
      
      const newPathId = parseInt(overContainer.replace('path-', ''));
      
      let newPuzzles = [...prev];
      newPuzzles[activeIndex] = { ...newPuzzles[activeIndex], pathId: newPathId };

      return arrayMove(newPuzzles, activeIndex, overIndex);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
     const { active, over } = event;
     setActiveId(null);
     
    if (!over || active.id === over.id) {
      return;
    }
    
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) {
        return;
    }
    
    const oldIndex = puzzles.findIndex(p => p.id === active.id);
    const newIndex = puzzles.findIndex(p => p.id === over.id);

    const newOrderedPuzzles = arrayMove(puzzles, oldIndex, newIndex);
    setPuzzles(newOrderedPuzzles);

    // Save to Firestore
    const batch = writeBatch(db);
    newOrderedPuzzles.forEach((puzzle, index) => {
        const puzzleRef = doc(db, 'puzzles', puzzle.id);
        const pathId = puzzle.pathId || 1;
        const puzzlesInThisPath = newOrderedPuzzles.filter(p => (p.pathId || 1) === pathId);
        const orderInPath = puzzlesInThisPath.findIndex(p => p.id === puzzle.id);

        batch.update(puzzleRef, { 
            pathId: pathId, 
            order: orderInPath
        });
    });

    try {
      await batch.commit();
      toast({ title: "Puzzles Updated", description: "Your puzzle order and paths have been saved." });
    } catch (error) {
      console.error("Failed to save puzzle order:", error);
      toast({ title: "Save Failed", description: "Could not save your changes. Please try again.", variant: 'destructive' });
      // Revert optimistic update on failure if desired
    }
  };

  const onSubmit = async (data: PuzzleFormValues) => {
    setIsSubmitting(true);
    try {
      const puzzleData = {
        ...data,
        title: data.title,
        puzzle: data.puzzle,
        hint: data.hint,
        answer: data.answer,
        pathId: data.pathId ? parseInt(data.pathId, 10) : 1,
      };

      if (editingPuzzle) {
        const puzzleRef = doc(db, 'puzzles', editingPuzzle.id);
        await updateDoc(puzzleRef, puzzleData);
        toast({ title: 'Puzzle Updated' });
      } else {
        const pathId = puzzleData.pathId;
        const puzzlesInPath = puzzles.filter(p => (p.pathId || 1) === pathId);
        await addDoc(collection(db, 'puzzles'), {
          ...puzzleData,
          order: puzzlesInPath.length,
        });
        toast({ title: 'Puzzle Added' });
      }
      setShowAddForm(false);
      setEditingPuzzle(null);
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
    if (isDetailedView) return;
    setViewingPuzzle(puzzle);
    setIsViewDialogOpen(true);
  };

  const openEditForm = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setShowAddForm(true);
    setIsViewDialogOpen(false); 
    form.reset({
      title: puzzle.title,
      puzzle: puzzle.puzzle,
      hint: puzzle.hint,
      answer: puzzle.answer,
      pathId: puzzle.pathId ? String(puzzle.pathId) : '1',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleAddNewClick = () => {
    setEditingPuzzle(null);
    form.reset({ title: '', puzzle: '', hint: '', answer: '', pathId: '1' });
    setShowAddForm(!showAddForm);
  };

  const handleCancel = () => {
      setShowAddForm(false);
      setEditingPuzzle(null);
  }

  const activePuzzle = activeId ? puzzles.find(p => p.id === activeId) : null;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start flex-wrap gap-4">
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
          <Button onClick={handleAddNewClick}>
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
                 <FormField
                  control={form.control}
                  name="pathId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Path</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? '1'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a path" /></SelectTrigger></FormControl>
                        <SelectContent>{[1, 2, 3, 4, 5].map(i => (<SelectItem key={i} value={String(i)}>{`Path ${i}`}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>)} />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Save Puzzle</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {Object.entries(puzzlesByPath).map(([pathId, pathPuzzles]) => (
            <PuzzlePathColumn key={pathId} id={pathId} title={`Path ${pathId.split('-')[1]}`} puzzles={pathPuzzles} onOpen={openViewDialog} isDetailedView={isDetailedView} onEdit={openEditForm} />
          ))}
        </div>
      </DndContext>

      {viewingPuzzle && !isDetailedView && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingPuzzle.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Puzzle</h4>
                <p className="whitespace-pre-wrap">{viewingPuzzle.puzzle}</p>
              </div>
               {viewingPuzzle.hint && (
                    <div>
                        <h4 className="font-semibold">Hint</h4>
                        <p>{viewingPuzzle.hint}</p>
                    </div>
                )}
              <div>
                <h4 className="font-semibold">Answer</h4>
                <p className="font-mono bg-muted p-1 rounded-md text-sm">{viewingPuzzle.answer}</p>
              </div>
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
