import express from "express";
import { createMatch, getMatches, getMatchById, updateMatch, getCompletedMatches,
    getSquadMatches, joinMatch, getBookedMatches, getMatchDetails, 
    getTodayCompletedMatches, updateMatchLink, getAllMatchesWithLinks, 
    getMatchFee,
    getTdmMatches,
    getSoloMatches,
    getMatchWithTeams} from "../controllers/matchController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";
import { getFestivals, getPanchangamByDate, getRasiPhalam } from "../controllers/calendarController.js";

const router = express.Router();

// Create a match (Admin only)
router.post("/panchang", getPanchangamByDate);
router.post("/rasi-phalam",getRasiPhalam)
router.get("/festivals",getFestivals)


export default router;
