// Pinecone vector database integration for intelligent task-to-worker matching
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const VECTOR_ENABLED = !!(process.env.PINECONE_API_KEY && process.env.OPENAI_API_KEY);

const pinecone = VECTOR_ENABLED
  ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  : null;

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = VECTOR_ENABLED
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  : null;

const INDEX_NAME = "my-agentic-overlord";

async function getEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error("OpenAI not configured");
  }
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

export async function initializeVectorIndex() {
  if (!VECTOR_ENABLED || !pinecone) {
    console.log("Vector matching disabled (Pinecone/OpenAI not configured)");
    return;
  }
  
  try {
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === INDEX_NAME);

    if (!indexExists) {
      console.log(`Pinecone index '${INDEX_NAME}' does not exist. Checking for available indexes...`);
      
      if (indexes.indexes && indexes.indexes.length > 0) {
        console.log(`Using existing index: ${indexes.indexes[0].name} as fallback`);
        return;
      }
      
      console.log("No Pinecone indexes available. Vector matching will be disabled.");
      console.log("Workers will be matched using fallback logic (all available workers).");
    } else {
      console.log(`Pinecone index '${INDEX_NAME}' is ready`);
    }
  } catch (error) {
    console.error("Error initializing Pinecone index:", error);
    console.log("Vector matching will be disabled. Using fallback worker matching.");
  }
}

export async function addWorkerToVectorDB(workerId: string, skills: string[]) {
  if (!VECTOR_ENABLED || !pinecone) {
    return;
  }
  
  try {
    const indexes = await pinecone.listIndexes();
    if (!indexes.indexes || indexes.indexes.length === 0) {
      console.log(`Skipping vector DB indexing for worker ${workerId} - no indexes available`);
      return;
    }

    const indexName = indexes.indexes.find((idx) => idx.name === INDEX_NAME)?.name || indexes.indexes[0].name;
    const index = pinecone.index(indexName);
    const skillsText = skills.join(", ");
    const embedding = await getEmbedding(skillsText);

    await index.upsert([
      {
        id: workerId,
        values: embedding,
        metadata: {
          workerId,
          skills: skillsText,
        },
      },
    ]);

    console.log(`Added worker ${workerId} to vector DB index: ${indexName}`);
  } catch (error) {
    console.error("Error adding worker to vector DB:", error);
  }
}

export async function findMatchingWorkers(
  taskDescription: string,
  topK: number = 10
): Promise<string[]> {
  if (!VECTOR_ENABLED || !pinecone) {
    return [];
  }
  
  try {
    const indexes = await pinecone.listIndexes();
    if (!indexes.indexes || indexes.indexes.length === 0) {
      console.log("No Pinecone indexes available - using fallback worker matching");
      return [];
    }

    const indexName = indexes.indexes.find((idx) => idx.name === INDEX_NAME)?.name || indexes.indexes[0].name;
    const index = pinecone.index(indexName);
    const embedding = await getEmbedding(taskDescription);

    const queryResponse = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    const matchedIds = queryResponse.matches?.map((match) => match.id) || [];
    console.log(`Vector search found ${matchedIds.length} matching workers`);
    return matchedIds;
  } catch (error) {
    console.error("Error finding matching workers:", error);
    return [];
  }
}
