import express from "express";
import {
  uploadPayment,
  approvePayment,
  getPendingPayments,
  getWalletBalance,
} from "../controllers/paymentController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🧾 User uploads payment proof
router.post("/upload", verifyToken, uploadPayment);

// 🧾 Admin views pending payments
router.get("/pending", verifyAdmin, getPendingPayments);

// ✅ Admin approves/rejects payment
router.put("/approve/:id", verifyAdmin, approvePayment);
router.put("/reject/:id", verifyAdmin, approvePayment);
router.get("/balance/:id", verifyToken, getWalletBalance);

export default router;
