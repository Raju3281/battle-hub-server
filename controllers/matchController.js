import Match from "../models/Match.js";
import Teams from "../models/Teams.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
import WalletTransaction from "../models/WalletTransaction.js";
// 🧩 Create a new match (Admin only)
export const createMatch = async (req, res) => {
  try {
    const {
      matchName,
      matchType,
      entryFee,
      matchMap,
      prizePool,
      matchTime,
      prizeDistribution,
      highestKillBonus,
      remarks,
    } = req.body;

    // Validation
    if (!matchName || !matchType || !entryFee || !prizePool || !matchTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMatch = await Match.create({
      matchName,
      matchType,
      entryFee,
      prizePool,
      matchTime,
      matchMap: matchMap || "",
      createdBy: req.user.id,
      prizeDistribution: prizeDistribution || [],
      highestKillBonus: highestKillBonus || 0,
      remarks: remarks || "",
    });

    res.status(201).json({
      message: "✅ Match created successfully!",
      match: newMatch,
    });
  } catch (error) {
    console.error("Error creating match:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🧩 Get all matches (Public or Protected)
export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ matchTime: -1 });
    res.status(200).json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🧩 Get match by ID
export const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.status(200).json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🧩 Update existing match (Admin only)
export const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;

    // Find existing match
    const existingMatch = await Match.findById(id);
    if (!existingMatch)
      return res.status(404).json({ message: "Match not found" });

    // Update allowed fields
    const allowedFields = [
      "matchName",
      "matchType",
      "entryFee",
      "prizePool",
      "matchTime",
      "prizeDistribution",
      "highestKillBonus",
      "remarks",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        existingMatch[field] = req.body[field];
      }
    });

    await existingMatch.save();

    res.status(200).json({
      message: "✅ Match updated successfully!",
      match: existingMatch,
    });
  } catch (error) {
    console.error("Error updating match:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// controllers/matchController.js
export const getCompletedMatches = async (req, res) => {
  try {
    // Fetch matches where status === "completed"
    const completedMatches = await Match.find({ status: "completed" })
      .sort({ matchTime: -1 })
      .select("matchName matchType prizePool matchTime results"); // optional: select only needed fields

    // If none found
    if (completedMatches.length === 0) {
      return res.status(200).json({ message: "No completed matches found", matches: [] });
    }

    // Return matches
    res.status(200).json({ matches: completedMatches });
  } catch (error) {
    console.error("❌ Error fetching completed matches:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


export const getSquadMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      matchType: "squad",
      status: "upcoming",
    }).sort({ matchTime: 1 });

    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getSoloMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      matchType: "solo",
      status: "upcoming",
    }).sort({ matchTime: 1 });

    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getTdmMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      matchType: "tdm",
      status: "upcoming",
    }).sort({ matchTime: 1 });
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const joinMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, teamName, players } = req.body;

    if (!userId || !players) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    // 🎯 Get Match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // 🎯 Detect required players (Safely supports SOLO, DUO, SQUAD, TDM)
    const [mode, members] = match.matchMap?.split(",") || [];

    let requiredPlayers = 1; // Default solo

    if (members?.includes("v")) {
      // If matchMap format has "2v2" or "4v4"
      requiredPlayers = parseInt(members.split("v")[0]);
    } else {
      // No "v" → use matchType fallback
      switch (match.matchType?.toLowerCase()) {
        case "squad":
          requiredPlayers = 4;
          break;
        case "duo":
          requiredPlayers = 2;
          break;
        case "solo":
        default:
          requiredPlayers = 1;
          break;
      }
    }

    // 🛑 Team Name required only if more than 1 player
    if (requiredPlayers > 1 && !teamName) {
      return res.status(400).json({
        success: false,
        message: "Team Name is required for this match.",
      });
    }

    // 🛑 Player count validation
    if (!Array.isArray(players) || players.length !== requiredPlayers) {
      return res.status(400).json({
        success: false,
        message: `This match requires exactly ${requiredPlayers} player(s).`,
      });
    }

    // 🛑 Duplicate IDs inside same team
    const bgmiIds = players.map((p) => p.inGameId);
    if (new Set(bgmiIds).size !== bgmiIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate BGMI IDs found inside your team.",
      });
    }

    // 🛑 Duplicate IDs in other teams
    const duplicateTeam = await Teams.findOne({
      matchId,
      "players.inGameId": { $in: bgmiIds },
    });
    if (duplicateTeam) {
      const registeredIds = duplicateTeam.players.map((p) => p.inGameId);
      const duplicateId = bgmiIds.find((id) => registeredIds.includes(id));
      return res.status(400).json({
        success: false,
        message: `BGMI ID ${duplicateId} is already registered in another team.`,
      });
    }

    // ⏳ Registration Time Check
    const FIVE_HOURS_30_MIN = 5.5 * 60 * 60 * 1000;
    const FIFTEEN_MIN = 15 * 60 * 1000;
    const matchTime = new Date(match.matchTime);
    const registrationClose = new Date(
      matchTime.getTime() - FIVE_HOURS_30_MIN - FIFTEEN_MIN
    );

    if (new Date() > registrationClose) {
      return res.status(400).json({
        success: false,
        message: "Registration time ended.",
      });
    }

    // 🟢 Prevent double registration for same user
    const existingTeam = await Teams.findOne({ matchId, leaderId: userId });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: "You already have a registered entry for this match.",
      });
    }

    // 🟢 Fetch User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 💰 Wallet Check
    const totalAvailable =
      (user.referralBalance || 0) + (user.walletBalance || 0);

    if (totalAvailable < match.entryFee) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance.",
      });
    }

    // 🔻 Deduct entry fee (Referral first)
    let remainingFee = match.entryFee;

    if (user.referralBalance > 0) {
      const useReferral = Math.min(user.referralBalance, remainingFee);
      user.referralBalance -= useReferral;
      remainingFee -= useReferral;
    }

    if (remainingFee > 0) {
      user.walletBalance -= remainingFee;
    }
    await user.save();

    // 💳 Log Wallet Transaction
    await WalletTransaction.create({
      userId,
      matchId,
      amount: match.entryFee,
      type: "debit",
      status: "joined",
      source: "match_prize",
      referralUsed: match.entryFee - remainingFee,
      walletUsed: remainingFee,
      balanceAfter: user.walletBalance,
    });

    // 🎯 SLOT ASSIGNMENT — SOLO=80, Others=20
    const existingTeamsCount = await Teams.countDocuments({ matchId });

    if (requiredPlayers === 1 && existingTeamsCount >= 80) {
      return res.status(400).json({
        success: false,
        message: "Slots full (80 solo slots max).",
      });
    }

    if (requiredPlayers > 1 && existingTeamsCount >= 20) {
      return res.status(400).json({
        success: false,
        message: "Slots full (20 teams max).",
      });
    }

    let slotNumber;
    if (requiredPlayers === 1) {
      slotNumber = existingTeamsCount + 1; // Solo starts from 1
    } else if (mode === "tdm") {
      slotNumber = existingTeamsCount + 1;
    } else {
      slotNumber = existingTeamsCount + 2; // squad/duo starts at 2
    }

    // 🟢 Create Team/Entry
    await Teams.create({
      matchId,
      leaderId: userId,
      teamName:
        teamName || players[0].playerName || players[0].inGameId, // Auto for solo
      players,
      slotNumber,
    });

    return res.json({
      success: true,
      message: `${
        requiredPlayers === 1 ? "SOLO" : mode?.toUpperCase()
      } registered successfully.`,
      newWalletBalance: user.walletBalance,
      slotNumber,
    });
  } catch (err) {
    console.error("Join Match Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMatchFee = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId).select("entryFee");

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }
    return res.json({
      success: true,
      entryFee: match.entryFee,
    });
  } catch (err) {
    console.error("Get Match Fee Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export const getBookedMatches = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Get all teams created by the user
    const teams = await Teams.find({ leaderId: userId });
    if (teams.length === 0) {
      return res.json({
        success: true,
        bookedMatches: [],
      });
    }

    const matchIds = teams.map((t) => t.matchId);

    // 3️⃣ Fetch match details
    const matches = await Match.find({ _id: { $in: matchIds } })
      .sort({ matchTime: 1 })
      .lean();

    // 4️⃣ Fetch room details (if any)
    const rooms = await Room.find({ matchId: { $in: matchIds } }).lean();

    const roomMap = {};
    rooms.forEach((r) => {
      roomMap[r.matchId.toString()] = r;
    });

    // 5️⃣ Merge response
    const finalResponse = matches.map((match) => {
      const team = teams.find(
        (t) => t.matchId.toString() === match._id.toString()
      );

      const room = roomMap[match._id.toString()] || null;

      return {
        matchId: match._id,
        title: match.matchName,
        type: match.matchType,
        matchTime: match.matchTime,
        entryFee: match.entryFee,
        prizePool: match.prizePool,

        // Team details
        teamName: team.teamName,
        players: team.players,

        // Explicit room check
        roomAvailable: room ? true : false,

        roomId: room ? room.roomId : null,
        password: room ? room.password : null,
        roomServer: room ? room.server : null,
        roomMap: room ? room.map : null,
        roomNotes: room ? room.notes : null,
        status: match.status,
      };
    });

    return res.json({
      success: true,
      bookedMatches: finalResponse,
    });

  } catch (err) {
    console.error("❌ Error fetching booked matches:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId).lean();
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    const room = await Room.findOne({ matchId }).lean();

    // Get all teams sorted by slotNumber
    const teams = await Teams.find({ matchId })
      .sort({ slotNumber: 1 })
      .lean();

    return res.json({
      success: true,
      match: {
        matchId: match._id,
        title: match.matchName,
        type: match.matchType,
        entryFee: match.entryFee,
        prizePool: match.prizePool,
        matchTime: match.matchTime,
      },
      room: room || null,
      slots: teams.map(t => ({
        slotNumber: t.slotNumber,
        teamName: t.teamName,
        players: t.players
      }))
    });

  } catch (err) {
    console.error("Match Detail Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const getTodayCompletedMatches = async (req, res) => {
  try {
    // 🗓️ Get today range
    const end = new Date(); // Now
    const start = new Date();
    start.setDate(end.getDate() - 7); // 7 days back
    start.setHours(0, 0, 0, 0);

    // 🎯 Find matches where:
    // 1. status = "completed"
    // 2. updatedAt is today
    const matches = await Match.find({
      status: "completed",
      updatedAt: { $gte: start, $lte: end },
    })
      .sort({ updatedAt: -1 })
      .select(
        "matchName matchType prizePool matchTime results topTeams topKiller updatedAt"
      ) // select only what you need
      .lean();

    return res.json({
      success: true,
      matches,
    });

  } catch (err) {
    console.error("❌ Error fetching today's completed matches:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const updateMatchLink = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { matchLink } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    match.matchLink = matchLink;
    await match.save();

    return res.json({
      success: true,
      message: "Match link updated successfully",
      matchLink: match.matchLink,
    });

  } catch (error) {
    console.error("Error updating match link:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllMatchesWithLinks = async (req, res) => {
  try {
    const matches = await Match.find({
      matchLink: { $ne: null }
    }).select("matchName matchType map matchTime matchLink");

    return res.json({
      success: true,
      matches
    });

  } catch (err) {
    console.error("Error fetching match links:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};








