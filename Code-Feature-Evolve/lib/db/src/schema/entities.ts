import { pgTable, serial, text, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const entitiesTable = pgTable("entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  influence: real("influence").notNull().default(0.5),
  stability: real("stability").notNull().default(0.5),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const relationshipsTable = pgTable("relationships", {
  id: serial("id").primaryKey(),
  sourceId: serial("source_id").notNull(),
  targetId: serial("target_id").notNull(),
  type: text("type").notNull(),
  strength: real("strength").notNull().default(0.5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEntitySchema = createInsertSchema(entitiesTable).omit({ id: true, createdAt: true });
export const insertRelationshipSchema = createInsertSchema(relationshipsTable).omit({ id: true, createdAt: true });
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entitiesTable.$inferSelect;
export type Relationship = typeof relationshipsTable.$inferSelect;
