
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

The name is generated for people from house: {{{houseName}}}.

Draw inspiration from the vast well of Indian culture, including mythology, food, historical figures, or places. The name should evoke a sense of adventure and cleverness

it is okay if the name doesn't have any exisiting meaning but sounds like a mystery indian food or mythological figure or something else

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
