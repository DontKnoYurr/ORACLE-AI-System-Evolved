import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalsRouter from "./signals";
import entitiesRouter from "./entities";
import predictionsRouter from "./predictions";
import anomaliesRouter from "./anomalies";
import agentsRouter from "./agents";
import simulationsRouter from "./simulations";
import oracleRouter from "./oracle";
import worldRouter from "./world";
import seismicRouter from "./seismic";
import quantumRouter from "./quantum";
import temporalRouter from "./temporal";
import trainingRouter from "./training";
import intelligenceRouter from "./intelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signalsRouter);
router.use(entitiesRouter);
router.use(predictionsRouter);
router.use(anomaliesRouter);
router.use(agentsRouter);
router.use(simulationsRouter);
router.use(oracleRouter);
router.use(worldRouter);
router.use(seismicRouter);
router.use(quantumRouter);
router.use(temporalRouter);
router.use(trainingRouter);
router.use(intelligenceRouter);

export default router;
