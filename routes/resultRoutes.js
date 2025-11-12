import express from "express";
import { updateMatchResults } from "../controllers/resultController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/:matchId", verifyToken, verifyAdmin, updateMatchResults);

export default router;
