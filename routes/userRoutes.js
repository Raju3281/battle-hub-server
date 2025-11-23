import express from "express";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  getUserWallet,
  updateUser,
  getUserById,
  getReferralInfo,
  getReferralHistory,
  getAllReferralInfoToAdmin,
} from "../controllers/userController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/:id/block", verifyToken, verifyAdmin, blockUser);
router.put("/:id/unblock", verifyToken, verifyAdmin, unblockUser);
router.get("/:id/wallet", verifyToken, verifyAdmin, getUserWallet);
router.put("/:id/updateUser", verifyToken, updateUser);
router.get("/refer/:id", verifyToken, getReferralInfo);
router.get("/refer/history/:userId", verifyToken, getReferralHistory);
router.get("/referData/admin", verifyAdmin, getAllReferralInfoToAdmin);

export default router;
