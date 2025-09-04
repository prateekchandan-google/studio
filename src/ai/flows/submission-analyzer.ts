// This is a dummy flow. You can import from it but do not modify it.

export async function analyzeSubmission(
  text: string,
  image?: File
): Promise<{ analysis: string; confidence: number }> {
  console.log('Analyzing submission:', { text, image: image?.name });
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const confidence = Math.random();
  let analysis = 'The AI is moderately confident in this solution.';
  if (confidence > 0.75) {
    analysis = 'The AI is highly confident this solution is correct.';
  } else if (confidence < 0.25) {
    analysis =
      'The AI has low confidence in this solution. Manual review is recommended.';
  }

  return {
    analysis,
    confidence: Math.round(confidence * 100),
  };
}
