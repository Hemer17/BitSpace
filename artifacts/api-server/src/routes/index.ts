import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import artistsRouter from "./artists";
import eventsRouter from "./events";
import feedRouter from "./feed";
import ticketsRouter from "./tickets";
import merchRouter from "./merch";
import statsRouter from "./stats";
import songsRouter from "./songs";
import adminRouter from "./admin";
import shopRouter from "./shop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(artistsRouter);
router.use(eventsRouter);
router.use(feedRouter);
router.use(ticketsRouter);
router.use(merchRouter);
router.use(statsRouter);
router.use(songsRouter);
router.use(adminRouter);
router.use(shopRouter);

export default router;
