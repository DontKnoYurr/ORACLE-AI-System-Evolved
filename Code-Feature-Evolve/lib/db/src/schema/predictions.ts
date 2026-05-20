import { pgTable, serial, text, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  probability: real("probability").notNull().default(0.5),
  horizon: text("horizon").notNull(),
  impact: text("impact").notNull().default("medium"),
  domain: text("domain").notNull(),
  temporalScale: text("temporal_scale"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
