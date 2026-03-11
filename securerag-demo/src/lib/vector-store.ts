import { Document } from './types';
import { documents } from './mock-data';
import { getEmbedding, getEmbeddings } from './openai';

interface DocVector {
  docId: string;
  embedding: number[];
}

let indexCache: DocVector[] | null = null;
let indexPromise: Promise<void> | null = null;

/**
 * Build the in-memory vector index on first call.
 * Embeds all 12 mock documents via OpenAI and caches the result.
 */
async function ensureIndex(): Promise<void> {
  if (indexCache) return;

  // Prevent concurrent index builds
  if (indexPromise) {
    await indexPromise;
    return;
  }

  indexPromise = (async () => {
    const texts = documents.map(
      (doc) => `${doc.title}\n${doc.tags.join(', ')}\n${doc.content}`
    );
    const embeddings = await getEmbeddings(texts);

    indexCache = documents.map((doc, i) => ({
      docId: doc.id,
      embedding: embeddings[i],
    }));
  })();

  await indexPromise;
  indexPromise = null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Search for the most similar documents to the given query.
 * Returns up to `topK` documents ranked by cosine similarity.
 */
export async function searchSimilar(
  query: string,
  topK: number = 6
): Promise<Document[]> {
  await ensureIndex();

  const queryEmbedding = await getEmbedding(query);

  const scored = indexCache!.map((item) => ({
    docId: item.docId,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  const topIds = scored.slice(0, topK).map((s) => s.docId);
  return topIds
    .map((id) => documents.find((d) => d.id === id)!)
    .filter(Boolean);
}
