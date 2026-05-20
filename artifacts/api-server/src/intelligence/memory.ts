import fs from "fs/promises";
import path from "path";
import { brain } from "./brain.js";

export class KnowledgeEngine {
  private vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  async syncVault() {
    try {
      const files = await this.recursiveReadDir(this.vaultPath);
      const mdFiles = files.filter((f) => f.endsWith(".md"));

      for (const file of mdFiles) {
        const content = await fs.readFile(file, "utf-8");
        const relativePath = path.relative(this.vaultPath, file);
        
        await brain.ingest(content, {
          source: "obsidian",
          path: relativePath,
          lastModified: (await fs.stat(file)).mtime.toISOString(),
        });
      }
      
      return { success: true, count: mdFiles.length };
    } catch (error) {
      console.error("Vault sync error:", error);
      return { success: false, error };
    }
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
