/**
 * ORACLE Intelligence Harvester Routes
 * Web intelligence gathering and status endpoints.
 */
import { Router } from "express";
import { runHarvest, getHarvesterStatus, startHarvestLoop } from "../intelligence/harvester.js";

const router = Router();

// Start the autonomous harvest loop when this route is first mounted
startHarvestLoop();

/**
 * GET /intelligence/status — harvester status and config
 */
router.get("/intelligence/status", (req, res) => {
  return res.json(getHarvesterStatus());
});

/**
 * POST /intelligence/harvest — manually trigger a harvest cycle
 */
router.post("/intelligence/harvest", async (req, res) => {
  try {
    const result = await runHarvest();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "Harvest failed", details: err.message });
  }
});

export default router;
