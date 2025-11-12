import express from "express";
import {
  uploadRecharge,
  getPendingRecharges,
  approveRecharge,
  getUserRecharges,
} from "../controllers/rechargeController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🧾 User uploads recharge proof
router.post("/upload", verifyToken, uploadRecharge);

// 💳 User gets their own recharge history
router.get("/my", verifyToken, getUserRecharges);

// 🧾 Admin views pending recharges
router.get("/pending", verifyAdmin, getPendingRecharges);

// ✅ Admin approves/rejects recharge
router.put("/:id", verifyAdmin, approveRecharge);

export default router;
