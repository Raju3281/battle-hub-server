import express from "express";
import { createRechargeTransaction, getWalletHistory, updateWalletTransactionStatus, withdrawalRequest } from "../controllers/walletController.js";
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
router.post("/withdraw", verifyToken, withdrawalRequest);
router.get("/history/:userId", verifyToken, getWalletHistory);


export default router;