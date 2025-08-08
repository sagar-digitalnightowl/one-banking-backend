import { Router } from "express";
import {
  getAllUsers,
  getUser,
  getUserCount,
  giftClaimed,
  saveUserInfo,
  sendVerificationEmail,
  verifyEmail,
} from "../controllers/waitingList.controller.js";
import { auth, isAdmin } from "../middlewares/Auth.middleware.js";

const router = Router();

router
  .post("/send-verification-email", sendVerificationEmail)
  .post("/verify-email/:token", verifyEmail)
  .post("/save-user-info", saveUserInfo)
  .post("/claim-gift", giftClaimed)
  .get("/get-user-count", getUserCount)
  .get("/get-all-users", auth, isAdmin, getAllUsers)
  .post("/get-user", getUser);

export default router;
