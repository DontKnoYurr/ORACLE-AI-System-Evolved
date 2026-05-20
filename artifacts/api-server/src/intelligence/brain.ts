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

  /**
   * Groundbreaking reasoning engine that combines user query with retrieved knowledge.
   */
  async ask(question: string, context: any = {}) {
    // 1. Search for relevant knowledge in the vector database
    const searchResults = await this.search(question, 3);
    const retrievedContext = searchResults.documents[0]?.join("\n\n") || "No specific proprietary knowledge found for this query.";

    // 2. Construct the groundbreaking prompt
    const prompt = PromptTemplate.fromTemplate(`
      SYSTEM: You are the ORACLE Brain, a proprietary predictive intelligence system.
      Your goal is to provide groundbreaking, forward-looking analysis based on the user's private knowledge base.
      
      PROPRIETARY_KNOWLEDGE_CONTEXT:
      {retrievedContext}
      
      SYSTEM_STATE_CONTEXT:
      {systemContext}
      
      USER_QUERY:
      {question}
      
      ORACLE_ANALYSIS_VERDICT:
    `);

    // 3. Execute the reasoning chain
    const chain = RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({
      question,
      retrievedContext,
      systemContext: JSON.stringify(context, null, 2),
    });

    return {
      response,
      sources: searchResults.metadatas[0] || [],
    };
  }

  async ingest(text: string, metadata: any = {}) {
    const collection = await this.chroma.getOrCreateCollection({
      name: this.collectionName,
    });

    await collection.add({
      ids: [Date.now().toString() + Math.random().toString(36).substring(7)],
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
