import fs from "fs/promises";
import path from "path";
import { brain } from "./brain.js";

export class KnowledgeEngine {
  private vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  /**
   * Syncs the local Obsidian vault with the vector database.
   * This is the "Long-Term Memory" of the ORACLE Brain.
   */
  async syncVault() {
    try {
      const files = await this.recursiveReadDir(this.vaultPath);
      const mdFiles = files.filter((f) => f.endsWith(".md"));

      for (const file of mdFiles) {
        const content = await fs.readFile(file, "utf-8");
        const relativePath = path.relative(this.vaultPath, file);
        
        // Advanced Chunking: Split by headers or paragraphs to maintain context
        const chunks = this.chunkContent(content);
        
        for (let i = 0; i < chunks.length; i++) {
          await brain.ingest(chunks[i], {
            source: "obsidian",
            path: relativePath,
            chunkIndex: i,
            totalChunks: chunks.length,
            lastModified: (await fs.stat(file)).mtime.toISOString(),
            title: path.basename(file, ".md"),
          });
        }
      }
      
      return { success: true, count: mdFiles.length };
    } catch (error) {
      console.error("Vault sync error:", error);
      return { success: false, error };
    }
  }

  /**
   * Splits content into manageable chunks while preserving semantic meaning.
   */
  private chunkContent(content: string, maxLength: number = 1500): string[] {
    // Simple chunking by paragraph for now, can be upgraded to recursive character splitting
    const paragraphs = content.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
      if ((currentChunk + p).length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = p;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + p;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  private async recursiveReadDir(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const res = path.resolve(dir, entry.name);
        return entry.isDirectory() ? this.recursiveReadDir(res) : res;
      })
    );
    return files.flat();
  }
}

export const memory = new KnowledgeEngine(process.env.OBSIDIAN_VAULT_PATH || "./vault");
