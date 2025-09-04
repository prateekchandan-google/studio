"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserPlus, Users, X, Copy, Check } from 'lucide-react';

const houseNames = ["Halwa", "Chamcham", "Jalebi", "Ladoo"] as const;

const registrationSchema = z.object({
  houseName: z.enum(houseNames, { required_error: 'Please select a house.' }),
  members: z.array(z.object({ name: z.string().min(1, 'Member name cannot be empty.') }))
    .min(3, 'A minimum of 3 members is required.')
    .max(7, 'A maximum of 7 members is allowed.'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function RegistrationPage() {
  const [secretCode, setSecretCode] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      members: [{ name: '' }, { name: '' }, { name: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  const onSubmit = (data: RegistrationFormValues) => {
    console.log('Team Registered:', data);
    // In a real app, you would save this to a database.
    const newSecretCode = `${data.houseName.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`;
    setSecretCode(newSecretCode);
  };

  const copyToClipboard = () => {
    if (secretCode) {
      navigator.clipboard.writeText(secretCode);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  if (secretCode) {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">Registration Successful!</CardTitle>
                    <CardDescription>
                        Here is your secret code. Keep it safe! You'll need it to access the puzzles.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="bg-muted p-4 rounded-lg font-mono text-2xl tracking-widest relative">
                        <span>{secretCode}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 right-2 -translate-y-1/2"
                            onClick={copyToClipboard}
                        >
                            {hasCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </Button>
                    </div>
                     <p className="text-sm text-muted-foreground mt-4">
                        The game will begin once you log in with your code. Good luck!
                    </p>
                </CardContent>
                <CardFooter>
                    {/* This would link to the game page where the code is entered */}
                     <Button className="w-full" disabled>Proceed to Game (Not Implemented)</Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Register Your Team</CardTitle>
          <CardDescription>Assemble your team, choose your house, and get ready for an adventure!</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="houseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your house" />
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

              <div className="space-y-4">
                <Label>Team Members ({fields.length}/7)</Label>
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`members.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                           <FormControl>
                            <Input placeholder={`Member ${index + 1} Name/Alias`} {...field} />
                          </FormControl>
                          {fields.length > 3 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                 {form.formState.errors.members && (fields.length < 3 || fields.length > 7) && (
                    <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.members.message}
                    </p>
                )}
                {fields.length < 7 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '' })}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Register Team & Get Code
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
