"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { submissions as initialSubmissions } from "@/lib/data";
import type { Submission } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Bot, Loader } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { analyzeSubmission } from "@/ai/flows/submission-analyzer";

type SubmissionWithAI = Submission & {
  aiAnalysis?: string;
  aiConfidence?: number;
  isAnalyzing?: boolean;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionWithAI[]>([]);

  useEffect(() => {
    // In a real app, you'd verify a JWT or session cookie.
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem('pathfinder-admin-auth') === 'true';
      if (!isAuthenticated) {
        router.replace('/admin/login');
      } else {
        setIsVerified(true);
      }
    }
  }, [router]);
  
  useEffect(() => {
    if(isVerified) {
      // In a real app, you would fetch this from Firestore
      setSubmissions(initialSubmissions);
    }
  }, [isVerified])

  const handleDecision = (submissionId: string, decision: "approved" | "rejected") => {
    setSubmissions((prev) => prev.filter((sub) => sub.id !== submissionId));
    console.log(`Submission ${submissionId} has been ${decision}.`);
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

  if (!isVerified) {
    // You can show a loader here. For now, it's just a blank screen to avoid flash of content.
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Submission Review
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Approve or reject team submissions in real-time.
        </p>
      </header>

      {submissions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline">{submission.teamName}</CardTitle>
                    <CardDescription>
                      Puzzle: {submission.puzzleTitle}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {formatDistanceToNow(submission.timestamp, { addSuffix: true })}
                  </Badge>
                </div>
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
                  onClick={() => handleDecision(submission.id, "approved")}
                >
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDecision(submission.id, "rejected")}
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
