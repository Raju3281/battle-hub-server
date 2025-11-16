import express from "express";
import { createRechargeTransaction, updateWalletTransactionStatus } from "../controllers/walletController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });


const router = express.Router();
router.post("/transaction",  upload.single("file"), verifyToken, createRechargeTransaction);
router.put(
  "/update-status/:id",
  verifyAdmin,
  updateWalletTransactionStatus
);

export default router;