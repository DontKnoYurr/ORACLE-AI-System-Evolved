import { pgTable, serial, text, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentSessionsTable = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  context: text("context"),
  agents: json("agents").$type<Array<{name: string; role: string; stance: string; confidence: number; reasoning?: string}>>().notNull().default([]),
  consensus: text("consensus"),
  consensusScore: real("consensus_score"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentSessionSchema = createInsertSchema(agentSessionsTable).omit({ id: true, createdAt: true });
export type InsertAgentSession = z.infer<typeof insertAgentSessionSchema>;
export type AgentSession = typeof agentSessionsTable.$inferSelect;
