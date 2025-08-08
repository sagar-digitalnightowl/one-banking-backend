import { Router } from "express";
import authRoutes from "./auth.routes.js";
import waitingListRoutes from "./waitingList.routes.js";

const router = Router();

router.use("/auth", authRoutes).use("/waiting-list", waitingListRoutes);

export default router;
