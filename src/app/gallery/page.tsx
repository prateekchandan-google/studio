
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Submission } from '@/lib/types';
import Image from 'next/image';
import { Loader, ImageOff } from 'lucide-react';

export default function GalleryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Corrected query: Filter by image existence, then order by timestamp and limit the results.
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('imageSubmissionDataUri', '!=', null),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      submissionsQuery,
      (snapshot) => {
        const subs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate(),
          } as Submission;
        });
        setSubmissions(subs);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to fetch submissions:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header>
        <h1 className="text-4xl font.headline font-bold tracking-tight lg:text-5xl">Submission Gallery</h1>
        <p className="mt-2 text-lg text-muted-foreground">A collection of all photos submitted by the teams.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
          <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : submissions.length > 0 ? (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {submissions.map((submission) =>
            submission.imageSubmissionDataUri ? (
              <div key={submission.id} className="break-inside-avoid group relative">
                <Image
                  src={submission.imageSubmissionDataUri}
                  alt={`Submission by ${submission.teamName}`}
                  width={500}
                  height={500}
                  className="rounded-lg object-cover w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                  <p className="font-bold text-sm">{submission.teamName}</p>
                  <p className="text-xs">{submission.puzzleTitle}</p>
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <ImageOff className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No Images Yet</h2>
          <p className="text-muted-foreground mt-2">As teams make submissions, their photos will appear here.</p>
        </div>
      )}
    </div>
  );
}
