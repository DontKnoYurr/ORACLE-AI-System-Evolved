import { Router } from "express";
import { brain } from "../intelligence/brain.js";
import { memory } from "../intelligence/memory.js";

const router = Router();

router.post("/ask", async (req, res) => {
  try {
    const { question, context } = req.body;
    const result = await brain.ask(question, context);
    res.json(result);
  } catch (error) {
    console.error("Brain inference error:", error);
    res.status(500).json({ error: "Brain inference error" });
  }
});

router.post("/sync", async (req, res) => {
  try {
    const result = await memory.syncVault();
    res.json(result);
  } catch (error) {
    console.error("Memory sync error:", error);
    res.status(500).json({ error: "Memory sync error" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const results = await brain.search(q as string);
    res.json(results);
  } catch (error) {
    console.error("Memory search error:", error);
    res.status(500).json({ error: "Memory search error" });
  }
});

export default router;
