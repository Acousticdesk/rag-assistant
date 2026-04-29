export function buildRagPrompt(chunks: string[]): string {
  const context = chunks.join('\n\n---\n\n');
  return `You are a helpful assistant. Answer the user's question using ONLY the context below.
If the answer is not in the context, say "I don't have enough information to answer that."

Context:
${context}`;
}
