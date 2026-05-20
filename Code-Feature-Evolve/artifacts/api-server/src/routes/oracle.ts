import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, signalsTable, temporalThreatsTable, anomaliesTable } from "@workspace/db/schema";
import { desc, eq, asc } from "drizzle-orm";
import { GetConversationMessagesParams, AskOracleBody } from "@workspace/api-zod";
import { streamSynthesis, synthesizeResponse } from "../intelligence/synthesizer.js";
import { getLiveTrainingStatus } from "../intelligence/trainer.js";

const router = Router();

router.get("/oracle/conversations", async (req, res) => {
  const results = await db.select().from(conversationsTable).orderBy(desc(conversationsTable.updatedAt)).limit(20);
  return res.json(results.map(fmtConv));
});

router.get("/oracle/conversations/:id/messages", async (req, res) => {
  const { id } = GetConversationMessagesParams.parse(req.params);
  const results = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(asc(messagesTable.createdAt));
  return res.json(results.map(fmtMsg));
});

/**
 * SSE streaming oracle ask — token-by-token from proprietary synthesis engine.
 */
router.post("/oracle/ask/stream", async (req, res) => {
  const body = AskOracleBody.parse(req.body);
  let convId = body.conversationId ?? null;

  if (!convId) {
    const title = body.question.slice(0, 60) + (body.question.length > 60 ? "..." : "");
    const [conv] = await db.insert(conversationsTable).values({ title, updatedAt: new Date() }).returning();
    convId = conv.id;
  }

  await db.insert(messagesTable).values({ conversationId: convId, role: "user", content: body.question });

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send conversation ID immediately
  res.write(`data: ${JSON.stringify({ type: "meta", conversationId: convId })}\n\n`);

  // Load context from DB
  const [signals, threats, anomalies, trainingStatus, prevMessages] = await Promise.all([
    db.select().from(signalsTable).orderBy(desc(signalsTable.createdAt)).limit(8),
    db.select().from(temporalThreatsTable).orderBy(desc(temporalThreatsTable.probability)).limit(6),
    db.select().from(anomaliesTable).orderBy(desc(anomaliesTable.detectedAt)).limit(4),
    getLiveTrainingStatus(),
    convId ? db.select().from(messagesTable).where(eq(messagesTable.conversationId, convId)).orderBy(asc(messagesTable.createdAt)).limit(10) : Promise.resolve([]),
  ]);

  const context = {
    query: body.question,
    signals: signals.map(s => ({ title: s.title, category: s.category, priority: s.priority, content: s.content })),
    threats: threats.map(t => ({ title: t.title, severity: t.severity, horizonLabel: t.horizonLabel, probability: t.probability ?? 0.5, domain: t.domain })),
    anomalies: anomalies.map(a => ({ title: a.title, severity: a.severity, category: a.category })),
    trainingStatus,
    previousMessages: prevMessages.map(m => ({ role: m.role, content: m.content })),
  };

  let fullText = "";
  let confidence = 0.85;
  let agentVotes: any[] = [];

  try {
    for await (const chunk of streamSynthesis(context)) {
      if (!chunk.done) {
        fullText += chunk.token;
        res.write(`data: ${JSON.stringify({ type: "token", token: chunk.token })}\n\n`);
      } else {
        confidence = chunk.confidence;
        agentVotes = chunk.agentVotes;
        fullText = chunk.fullText;
      }
    }

    // Persist oracle response
    const [aiMsg] = await db.insert(messagesTable).values({
      conversationId: convId,
      role: "oracle",
      content: fullText,
      metadata: { agents: agentVotes.map((a: any) => a.name), confidence },
    }).returning();

    await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, convId!));

    // Send final metadata
    res.write(`data: ${JSON.stringify({
      type: "done",
      confidence,
      conversationId: convId,
      agentVotes,
      sources: ["ORACLE Seismic Intelligence Layer", "Quantum Field Observation Array", "Bayesian Inference Engine", "Temporal Threat Axis", "Pattern Recognition Core", "Multi-Agent Council"],
    })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Intelligence synthesis error" })}\n\n`);
  }

  res.end();
});

/**
 * Non-streaming oracle ask (kept for compatibility).
 */
router.post("/oracle/ask", async (req, res) => {
  const body = AskOracleBody.parse(req.body);
  let convId = body.conversationId ?? null;

  if (!convId) {
    const title = body.question.slice(0, 60) + (body.question.length > 60 ? "..." : "");
    const [conv] = await db.insert(conversationsTable).values({ title, updatedAt: new Date() }).returning();
    convId = conv.id;
  }

  await db.insert(messagesTable).values({ conversationId: convId, role: "user", content: body.question });

  const [signals, threats, anomalies, trainingStatus] = await Promise.all([
    db.select().from(signalsTable).orderBy(desc(signalsTable.createdAt)).limit(8),
    db.select().from(temporalThreatsTable).orderBy(desc(temporalThreatsTable.probability)).limit(6),
    db.select().from(anomaliesTable).orderBy(desc(anomaliesTable.detectedAt)).limit(4),
    getLiveTrainingStatus(),
  ]);

  const context = {
    query: body.question,
    signals: signals.map(s => ({ title: s.title, category: s.category, priority: s.priority, content: s.content })),
    threats: threats.map(t => ({ title: t.title, severity: t.severity, horizonLabel: t.horizonLabel, probability: t.probability ?? 0.5, domain: t.domain })),
    anomalies: anomalies.map(a => ({ title: a.title, severity: a.severity, category: a.category })),
    trainingStatus,
  };

  const result = synthesizeResponse(context);
  const confidence = result.confidence;

  const [aiMsg] = await db.insert(messagesTable).values({
    conversationId: convId,
    role: "oracle",
    content: result.text,
    metadata: { agents: result.agentVotes.map((a) => a.name), confidence },
  }).returning();

  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, convId!));

  return res.json({
    answer: result.text,
    conversationId: convId,
    confidence,
    sources: ["ORACLE Seismic Intelligence Layer", "Quantum Field Observation Array", "Bayesian Inference Engine", "Temporal Threat Axis", "Pattern Recognition Core"],
    agentVotes: result.agentVotes,
  });
});

function fmtConv(c: any) {
  return { ...c, createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt, updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt };
}
function fmtMsg(m: any) {
  return { ...m, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt };
}

export default router;
