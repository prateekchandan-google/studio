
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
  prompt: `You are a creative assistant for a treasure hunt game. Your task is to generate a fun, adventurous, and unique team name.

The name must be alliterative with the provided house name: {{{houseName}}}.

Draw inspiration from the vast well of Indian culture, including mythology, food, historical figures, or places. The name should evoke a sense of adventure and cleverness. For example, if the house name is "Jalebi", you could suggest "Jalebi Jaguars" or "Jalebi Jesters".

House Name: {{{houseName}}}

IMPORTANT: Ensure the generated name is different and creative each time. Avoid common or repetitive suggestions.
`,
  config: {
    temperature: 1.0,
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
