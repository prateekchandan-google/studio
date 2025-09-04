
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Users, Loader, X, Award } from 'lucide-react';

const houseNames = ["Halwa", "Chamcham", "Jalebi", "Ladoo"] as const;

const teamEditSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters.'),
  house: z.enum(houseNames, { required_error: 'Please select a house.' }),
  bonusScore: z.coerce.number().int().optional(),
});

type TeamEditFormValues = z.infer<typeof teamEditSchema>;

export default function TeamManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TeamEditFormValues>({
    resolver: zodResolver(teamEditSchema),
  });
  
  useEffect(() => {
    if (editingTeam) {
      form.reset({ name: editingTeam.name, house: editingTeam.house, bonusScore: 0 });
    } else {
      form.reset({ name: '', house: undefined, bonusScore: 0 });
    }
  }, [editingTeam, form]);


  useEffect(() => {
    const teamsQuery = query(collection(db, 'teams'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      teamsQuery,
      (querySnapshot) => {
        const teamsData: Team[] = [];
        querySnapshot.forEach((doc) => {
          teamsData.push({ id: doc.id, ...doc.data() } as Team);
        });
        setTeams(teamsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to fetch teams from Firestore', error);
        setTeams([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleEditClick = (team: Team) => {
    setEditingTeam(team);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingTeam(null);
  };

  const onSubmit = async (data: TeamEditFormValues) => {
    if (!editingTeam) return;

    setIsSubmitting(true);
    try {
      const teamRef = doc(db, 'teams', editingTeam.id);
      
      const updateData: any = {
        name: data.name,
        house: data.house,
      };

      if (data.bonusScore) {
          updateData.score = increment(data.bonusScore);
      }

      await updateDoc(teamRef, updateData);
      
      toast({ title: 'Team Updated', description: `"${data.name}" has been successfully updated.` + (data.bonusScore ? ` ${data.bonusScore} bonus points awarded.` : '')});
      setEditingTeam(null);
    } catch (error) {
      console.error('Failed to update team', error);
      toast({ title: 'Update Failed', description: 'Could not save team changes. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (teamId: string) => {
    try {
      await deleteDoc(doc(db, 'teams', teamId));
      toast({ title: 'Team Deleted', description: 'The team has been successfully removed.' });
      if (editingTeam?.id === teamId) {
        setEditingTeam(null);
      }
    } catch (error) {
      console.error('Failed to delete team', error);
      toast({ title: 'Deletion Failed', description: 'Could not delete the team. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Team Management
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          View, edit, and manage all registered teams.
        </p>
      </header>

      {editingTeam && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Edit className="w-6 h-6"/>
                    Edit Team: {editingTeam.name}
                </CardTitle>
                <CardDescription>
                    Modify the details for this team. Member management coming soon.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Team Name</FormLabel>
                                    <FormControl>
                                    <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="house"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>House</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select a house" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {houseNames.map(house => (
                                            <SelectItem key={house} value={house}>{house}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="bonusScore"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Award Bonus Score</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="Enter points to add to the current score" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex gap-2 justify-end">
                        <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Edit className="mr-2 h-4 w-4" />
                            )}
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>
            A list of all teams currently in the game.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Loading teams...
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.house}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" /> 
                        {team.members.length}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{team.score}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(team)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Team</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete Team</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the team
                                    "{team.name}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(team.id)}>
                                    Yes, delete it
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
