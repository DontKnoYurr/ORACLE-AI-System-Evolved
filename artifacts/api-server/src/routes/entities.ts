import { Router } from "express";
import { db } from "@workspace/db";
import { entitiesTable, relationshipsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  ListEntitiesQueryParams,
  CreateEntityBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/entities", async (req, res) => {
  const parsed = ListEntitiesQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};
  let results = await db.select().from(entitiesTable).orderBy(desc(entitiesTable.influence));
  if (params.type) results = results.filter((e) => e.type === params.type);
  return res.json(results.slice(0, params.limit ?? 100).map(formatEntity));
});

router.post("/entities", async (req, res) => {
  const body = CreateEntityBody.parse(req.body);
  const [entity] = await db
    .insert(entitiesTable)
    .values({
      name: body.name,
      type: body.type,
      description: body.description ?? null,
      influence: body.influence,
      stability: body.stability,
      metadata: {
        quantumEntanglement: Math.random() * 0.8,
        seismicSignature: ["alpha", "beta", "gamma", "delta"][Math.floor(Math.random() * 4)],
      },
    })
    .returning();
  return res.status(201).json(formatEntity(entity));
});

router.get("/entities/relationships", async (req, res) => {
  const results = await db.select().from(relationshipsTable).orderBy(desc(relationshipsTable.strength));
  return res.json(results.map(formatRelationship));
});

function formatEntity(e: any) {
  return {
    ...e,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
  };
}

function formatRelationship(r: any) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

export default router;
