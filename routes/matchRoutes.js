import express from "express";
import { createMatch, getMatches, getMatchById, updateMatch, getCompletedMatches,
    getSquadMatches, joinMatch, getBookedMatches, getMatchDetails, 
    getTodayCompletedMatches, updateMatchLink, getAllMatchesWithLinks, 
    getMatchFee,
    getTdmMatches,
    getSoloMatches} from "../controllers/matchController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a match (Admin only)
router.post("/create", verifyAdmin, createMatch);
// Update match by ID (Admin only)
router.put("/:id", verifyAdmin, updateMatch);

// Get all matches (Accessible to all logged users)
router.get("/", verifyToken, getMatches);

// Get single match by ID
router.get("/squad", verifyToken, getSquadMatches); 
router.get("/tdm", verifyToken, getTdmMatches); 
router.get("/solo", verifyToken, getSoloMatches);

router.get("/with-links",verifyToken, getAllMatchesWithLinks);
router.get("/:id", verifyToken, getMatchById);

router.get("/completed", verifyToken, getCompletedMatches); // ✅ new route

router.post("/join/:matchId", verifyToken,joinMatch);
router.get("/booked/:userId",verifyToken, getBookedMatches);
router.get("/details/:matchId",verifyToken, getMatchDetails);
router.get("/completed/today",verifyToken, getTodayCompletedMatches);
router.get("/matchFee/:matchId",verifyToken, getMatchFee);


router.post("/match-link/:matchId", verifyAdmin, updateMatchLink);
router.get("/with-links",verifyToken, getAllMatchesWithLinks);
export default router;
