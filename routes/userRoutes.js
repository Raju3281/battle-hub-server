import express from "express";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  getUserWallet,
} from "../controllers/userController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.put("/:id/block", verifyToken, verifyAdmin, blockUser);
router.put("/:id/unblock", verifyToken, verifyAdmin, unblockUser);
router.get("/:id/wallet", verifyToken, verifyAdmin, getUserWallet);

export default router;
