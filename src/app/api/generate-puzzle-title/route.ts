
import { generatePuzzleTitle } from '@/ai/flows/puzzle-name-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { puzzle } = await req.json();

  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle content is required' }, { status: 400 });
  }

  try {
    const { title } = await generatePuzzleTitle({ puzzle });
    return NextResponse.json({ title });
  } catch (error) {
    console.error('Failed to generate puzzle title', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}
