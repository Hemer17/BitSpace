import { Router, type IRouter } from "express";
import healthRouter from "./health";
import artistsRouter from "./artists";
import eventsRouter from "./events";
import feedRouter from "./feed";
import ticketsRouter from "./tickets";
import merchRouter from "./merch";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(artistsRouter);
router.use(eventsRouter);
router.use(feedRouter);
router.use(ticketsRouter);
router.use(merchRouter);
router.use(statsRouter);

export default router;
