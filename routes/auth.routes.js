import { Router } from "express";
import {
  login,
  logout,
  verifyAdminToken,
} from "../controllers/Admin.controller.js";
import { auth } from "../middlewares/Auth.middleware.js";

const router = Router();

router
  .post("/login", login)
  .post("/logout", logout)
  .post("/token-verify", auth, verifyAdminToken);

export default router;
