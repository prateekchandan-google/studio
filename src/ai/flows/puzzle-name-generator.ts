'use server';
/**
 * @fileOverview A puzzle title generation AI flow.
 *
 * - generatePuzzleTitle - A function that generates a puzzle title from the puzzle content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePuzzleTitleInputSchema = z.object({
  puzzle: z.string().describe('The content of the puzzle or riddle.'),
});
export type GeneratePuzzleTitleInput = z.infer<
  typeof GeneratePuzzleTitleInputSchema
>;

const GeneratePuzzleTitleOutputSchema = z.object({
  title: z
    .string()
    .describe('A short, two-word, gibberish but readable title that has no meaning.'),
});
export type GeneratePuzzleTitleOutput = z.infer<
  typeof GeneratePuzzleTitleOutputSchema
>;

export async function generatePuzzleTitle(
  input: GeneratePuzzleTitleInput
): Promise<GeneratePuzzleTitleOutput> {
  return generatePuzzleTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePuzzleTitlePrompt',
  input: {schema: GeneratePuzzleTitleInputSchema},
  output: {schema: GeneratePuzzleTitleOutputSchema},
  prompt: `You are a creative assistant. Generate a short, two-word, gibberish but readable title based on the following puzzle. The title should have no real meaning but should sound like it could be a name. Do not use any words from the puzzle itself.

Puzzle:
{{puzzle}}`,
});

const generatePuzzleTitleFlow = ai.defineFlow(
  {
    name: 'generatePuzzleTitleFlow',
    inputSchema: GeneratePuzzleTitleInputSchema,
    outputSchema: GeneratePuzzleTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
