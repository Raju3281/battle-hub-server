import express from "express";
import { getRoomDetails, updateRoomDetails } from "../controllers/roomController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";
const router = express.Router();
router.get("/:matchId",verifyToken, getRoomDetails);
router.post("/update/:matchId", verifyAdmin, updateRoomDetails);

export default router;