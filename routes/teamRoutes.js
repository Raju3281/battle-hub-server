import { getTeamsByMatch } from "../controllers/teamsController.js";
import express from "express";
const router = express.Router();


router.get("/:matchId", getTeamsByMatch);
export default router;