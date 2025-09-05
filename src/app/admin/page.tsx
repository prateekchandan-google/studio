
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import type { Submission, Team } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Bot, Loader, UserCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { analyzeSubmission } from "@/ai/flows/submission-analyzer";
import { collection, query, where, onSnapshot, orderBy, writeBatch, doc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


type SubmissionWithAI = Submission & {
  aiAnalysis?: string;
  aiConfidence?: number;
  isAnalyzing?: boolean;
};

const PUZZLE_REWARD = 10;

export default function AdminDashboardPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithAI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const submissionsQuery = query(
        collection(db, 'submissions'), 
        where('status', '==', 'pending'),
        orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubmissionWithAI));
        setSubmissions(subs);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch submissions:", error);
        toast({ title: 'Error', description: 'Could not fetch submissions.', variant: 'destructive'});
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDecision = async (submissionId: string, teamId: string, decision: "approved" | "rejected") => {
    const batch = writeBatch(db);
    const submissionRef = doc(db, "submissions", submissionId);
    const teamRef = doc(db, "teams", teamId);

    if (decision === "approved") {
        batch.update(submissionRef, { status: "approved" });
        batch.update(teamRef, { 
            score: increment(PUZZLE_REWARD),
            riddlesSolved: increment(1),
            currentPuzzleIndex: increment(1),
            currentSubmissionId: null,
        });
    } else { // rejected
        batch.update(submissionRef, { status: "rejected" });
        batch.update(teamRef, {
            currentSubmissionId: null,
        });
    }
    
    try {
        await batch.commit();
        toast({
            title: `Submission ${decision}`,
            description: `The team has been notified.`,
        });
    } catch (error) {
        console.error(`Failed to ${decision} submission:`, error);
        toast({ title: 'Error', description: 'Could not process decision.', variant: 'destructive'});
    }
  };

  const runAnalysis = async (submissionId: string) => {
    setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, isAnalyzing: true } : s));
    
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    // In a real app, you might want to send the image data to the flow as well.
    const result = await analyzeSubmission(submission.textSubmission, undefined);

    setSubmissions(prev => prev.map(s => 
      s.id === submissionId 
        ? { ...s, aiAnalysis: result.analysis, aiConfidence: result.confidence, isAnalyzing: false } 
        : s
    ));
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <div>
            <h1 className="text-4xl font.headline font-bold tracking-tight lg:text-5xl">
            Submission Review
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
            Approve or reject team submissions in real-time.
            </p>
        </div>
      </header>

      {isLoading ? (
         <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : submissions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font.headline">{submission.teamName}</CardTitle>
                    <CardDescription>
                      Puzzle: {submission.puzzleTitle}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {formatDistanceToNow(new Date(submission.timestamp as any), { addSuffix: true })}
                  </Badge>
                </div>
                 {submission.submittedBy && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        <UserCircle className="w-4 h-4"/>
                        <span>Submitted by {submission.submittedBy}</span>
                    </div>
                 )}
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <blockquote className="text-sm italic border-l-4 pl-4">"{submission.textSubmission}"</blockquote>
                {submission.imageSubmissionUrl && (
                  <div>
                    <p className="text-sm font-medium mb-2">Photo Submission:</p>
                    <div className="overflow-hidden rounded-lg">
                      <Image
                        src={submission.imageSubmissionUrl}
                        alt={`Submission from ${submission.teamName}`}
                        width={400}
                        height={300}
                        data-ai-hint="team photo"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2 pt-2">
                    {submission.aiAnalysis ? (
                        <div className="p-3 rounded-lg bg-secondary/50">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><Bot className="w-4 h-4"/> AI Analysis</h4>
                            <p className="text-sm text-muted-foreground mt-1">{submission.aiAnalysis}</p>
                            <p className="text-xs text-muted-foreground/80 mt-2">Confidence: {submission.aiConfidence}%</p>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => runAnalysis(submission.id)} disabled={submission.isAnalyzing}>
                            {submission.isAnalyzing ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                            {submission.isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
                        </Button>
                    )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleDecision(submission.id, submission.teamId, "approved")}
                >
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDecision(submission.id, submission.teamId, "rejected")}
                >
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">All Clear!</h2>
          <p className="text-muted-foreground mt-2">No pending submissions to review.</p>
        </div>
      )}
    </div>
  );
}
