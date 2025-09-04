"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, Key, Users } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  secretCode: z.string().min(1, 'Secret code cannot be empty.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function StartGamePage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      secretCode: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    // In a real app, you would validate the secret code against a database.
    // For this demo, we'll use a simple check and route to a dynamic game page.
    // We'll extract a teamId-like value from the code.
    if (data.secretCode.includes('-')) {
      const teamId = data.secretCode.split('-')[0];
      router.push(`/game/${teamId}`);
    } else {
      setError('Invalid secret code format.');
    }
  };


  return (
    <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Start the Game</CardTitle>
          <CardDescription>Enter your team's secret code to begin.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="secretCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Code</FormLabel>
                    <FormControl>
                      <Input placeholder="halwa-xxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Enter Challenge
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have a code?{' '}
                <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Register your team
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
