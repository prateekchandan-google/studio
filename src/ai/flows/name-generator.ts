
'use server';

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
  prompt: `You are a creative assistant for a treasure hunt game set in India.

Generate a fun, creative, and adventurous team name. The team name must be alliterative with the provided house name: {{{houseName}}}.

The team name should be inspired by Indian culture, food, or mythology, and it should also have a hint of adventure. For example, if the house name is "Halwa", a good team name could be "Halwa Heroes" or "Halwa Hunters".

House Name: {{{houseName}}}

IMPORTANT: Make sure to generate a different, unique name every time this prompt is used.
`,
  config: {
    temperature: 0.9,
  }
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
