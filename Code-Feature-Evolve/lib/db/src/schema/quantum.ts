import { pgTable, serial, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quantumNodesTable = pgTable("quantum_nodes", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("attractor"),
  label: text("label").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  strength: real("strength").notNull().default(0.5),
  polarity: real("polarity").notNull().default(0),
  probability: real("probability").notNull().default(0.5),
  associatedThreat: text("associated_threat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuantumNodeSchema = createInsertSchema(quantumNodesTable).omit({ id: true, createdAt: true });
export type InsertQuantumNode = z.infer<typeof insertQuantumNodeSchema>;
export type QuantumNode = typeof quantumNodesTable.$inferSelect;
