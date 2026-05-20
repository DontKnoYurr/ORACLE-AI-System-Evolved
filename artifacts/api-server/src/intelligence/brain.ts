import { Ollama } from "@langchain/ollama";
import { ChromaClient } from "chromadb";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export class OracleBrain {
  private model: Ollama;
  private chroma: ChromaClient;
  private collectionName = "oracle_knowledge";

  constructor() {
    this.model = new Ollama({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3",
    });
    this.chroma = new ChromaClient({
      path: process.env.CHROMA_PATH || "http://localhost:8000",
    });
  }

  async ask(question: string, context: any = {}) {
    const prompt = PromptTemplate.fromTemplate(`
      SYSTEM: You are the ORACLE Brain, a proprietary predictive intelligence system.
      Use the following context to provide a groundbreaking, forward-looking analysis.
      
      CONTEXT:
      {context}
      
      USER QUESTION:
      {question}
      
      ORACLE ANALYSIS:
    `);

    const chain = RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({
      question,
      context: JSON.stringify(context, null, 2),
    });

    return response;
  }

  async ingest(text: string, metadata: any = {}) {
    const collection = await this.chroma.getOrCreateCollection({
      name: this.collectionName,
    });

    await collection.add({
      ids: [Date.now().toString()],
      metadatas: [metadata],
      documents: [text],
    });
  }

  async search(query: string, limit: number = 5) {
    const collection = await this.chroma.getOrCreateCollection({
      name: this.collectionName,
    });

    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
    });

    return results;
  }
}

export const brain = new OracleBrain();
