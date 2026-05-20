import { pgTable, serial, text, timestamp, real, json, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingInteractionsTable = pgTable("training_interactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  target: text("target").notNull(),
  value: real("value"),
  context: json("context").$type<Record<string, unknown>>(),
  sessionId: text("session_id"),
  trainingWeight: real("training_weight").notNull().default(1.0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trainingCyclesTable = pgTable("training_cycles", {
  id: serial("id").primaryKey(),
  cycleId: text("cycle_id").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  epochsRun: integer("epochs_run").notNull().default(0),
  lossImprovement: real("loss_improvement").notNull().default(0),
  newInsights: json("new_insights").$type<string[]>().notNull().default([]),
  modelsUpdated: json("models_updated").$type<string[]>().notNull().default([]),
  interactionsProcessed: integer("interactions_processed").notNull().default(0),
  status: text("status").notNull().default("running"),
});

export const insertTrainingInteractionSchema = createInsertSchema(trainingInteractionsTable).omit({ id: true, createdAt: true });
export const insertTrainingCycleSchema = createInsertSchema(trainingCyclesTable).omit({ id: true });
export type InsertTrainingInteraction = z.infer<typeof insertTrainingInteractionSchema>;
export type TrainingInteraction = typeof trainingInteractionsTable.$inferSelect;
export type TrainingCycle = typeof trainingCyclesTable.$inferSelect;
