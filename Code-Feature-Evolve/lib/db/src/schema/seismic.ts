import { pgTable, serial, text, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seismicEventsTable = pgTable("seismic_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  resonanceType: text("resonance_type").notNull().default("unknown"),
  frequency: real("frequency").notNull().default(10),
  amplitude: real("amplitude").notNull().default(0.5),
  propagationRange: real("propagation_range").notNull().default(100),
  epicenterRegion: text("epicenter_region").notNull(),
  affectedRegions: json("affected_regions").$type<string[]>().notNull().default([]),
  emotionalValence: real("emotional_valence").notNull().default(0),
  intensity: real("intensity").notNull().default(0.5),
  waveform: json("waveform").$type<number[]>().notNull().default([]),
  decayRate: real("decay_rate").notNull().default(0.1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSeismicEventSchema = createInsertSchema(seismicEventsTable).omit({ id: true, createdAt: true });
export type InsertSeismicEvent = z.infer<typeof insertSeismicEventSchema>;
export type SeismicEvent = typeof seismicEventsTable.$inferSelect;
