import express from "express";
import { createMatch, getMatches, getMatchById, updateMatch, getCompletedMatches } from "../controllers/matchController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a match (Admin only)
router.post("/create", verifyAdmin, createMatch);
// Update match by ID (Admin only)
router.put("/:id", verifyAdmin, updateMatch);

// Get all matches (Accessible to all logged users)
router.get("/", verifyToken, getMatches);

// Get single match by ID
router.get("/:id", verifyToken, getMatchById);

router.get("/completed", verifyToken, getCompletedMatches); // ✅ new route

export default router;
