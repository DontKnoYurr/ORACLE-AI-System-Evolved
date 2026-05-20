import { pgTable, serial, text, timestamp, real, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const temporalThreatsTable = pgTable("temporal_threats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("medium"),
  horizonSeconds: real("horizon_seconds").notNull(),
  horizonLabel: text("horizon_label").notNull(),
  probability: real("probability").notNull().default(0.5),
  domain: text("domain").notNull(),
  indicators: json("indicators").$type<string[]>().notNull().default([]),
  mitigations: json("mitigations").$type<string[]>().notNull().default([]),
  seismicLink: integer("seismic_link"),
  quantumNode: integer("quantum_node"),
  velocity: real("velocity").notNull().default(0.3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTemporalThreatSchema = createInsertSchema(temporalThreatsTable).omit({ id: true, createdAt: true });
export type InsertTemporalThreat = z.infer<typeof insertTemporalThreatSchema>;
export type TemporalThreat = typeof temporalThreatsTable.$inferSelect;
