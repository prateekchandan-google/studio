'use server';
/**
 * @fileOverview A team name generation AI flow.
 *
 * - generateTeamName - A function that generates a team name.
 * - GenerateTeamNameInput - The input type for the generateTeamName function.
 * - GenerateTeamNameOutput - The return type for the generateTeamName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTeamNameInputSchema = z.object({
  houseName: z.string().describe('The name of the house the team belongs to.'),
});
export type GenerateTeamNameInput = z.infer<
  typeof GenerateTeamNameInputSchema
>;

const GenerateTeamNameOutputSchema = z.object({
  teamName: z
    .string()
    .describe('A creative and adventurous team name, alliterative with the house name.'),
});
export type GenerateTeamNameOutput = z.infer<
  typeof GenerateTeamNameOutputSchema
>;

export async function generateTeamName(
  input: GenerateTeamNameInput
): Promise<GenerateTeamNameOutput> {
  return generateTeamNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTeamNamePrompt',
  input: {schema: GenerateTeamNameInputSchema},
  output: {schema: GenerateTeamNameOutputSchema},
  prompt: `You are a creative assistant for a treasure hunt game.

Generate a fun, creative, and adventurous team name. The team name must be alliterative with the provided house name. Please feel free to be creative with 1-2 word house names and treasure hunt foo and good words.
`,
});

const generateTeamNameFlow = ai.defineFlow(
  {
    name: 'generateTeamNameFlow',
    inputSchema: GenerateTeamNameInputSchema,
    outputSchema: GenerateTeamNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
