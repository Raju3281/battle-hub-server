import Match from "../models/Match.js";
import Teams from "../models/Teams.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
// 🧩 Create a new match (Admin only)
export const createMatch = async (req, res) => {
  try {
    const {
      matchName,
      matchType,
      entryFee,
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

export const joinMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, teamName, players } = req.body;

    if (!userId || !teamName || !players) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    // 1️⃣ Team must contain exactly 4 players
    if (!Array.isArray(players) || players.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Team must contain exactly 4 players.",
      });
    }

    // 2️⃣ Check duplicate IDs WITHIN THE SAME TEAM
    const bgmiIds = players.map((p) => p.inGameId);
    const hasInternalDup = new Set(bgmiIds).size !== bgmiIds.length;

    if (hasInternalDup) {
      return res.status(400).json({
        success: false,
        message: "Duplicate BGMI IDs found inside your team. Each ID must be unique.",
      });
    }

    // 3️⃣ Match existence check
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // 4️⃣ Registration closes 15 min before match time
    const FIVE_HOURS_30_MIN = 5.5 * 60 * 60 * 1000;  // 5h 30m
            const FIFTEEN_MIN = 15 * 60 * 1000;
    const matchTime = new Date(match.matchTime);
    const registrationClose = new Date(matchTime.getTime() - FIVE_HOURS_30_MIN-FIFTEEN_MIN);

    if (new Date() > registrationClose) {
      return res.status(400).json({
        success: false,
        message: "Registration time ended. You cannot join now.",
      });
    }

    // 5️⃣ Prevent same leader from joining twice
    const existingTeam = await Teams.findOne({ matchId, leaderId: userId });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: "You already registered/created a team for this match.",
      });
    }

    // 6️⃣ Check duplicate BGMI IDs across ALL TEAMS OF THIS MATCH
    const duplicateTeam = await Teams.findOne({
      matchId,
      "players.inGameId": { $in: bgmiIds },
    });

    if (duplicateTeam) {
      const registeredIds = duplicateTeam.players.map((p) => p.inGameId);
      const duplicateId = bgmiIds.find((id) => registeredIds.includes(id));

      return res.status(400).json({
        success: false,
        message: `A player with BGMI ID ${duplicateId} is already registered in another team for this match.`,
      });
    }

    // 7️⃣ Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 8️⃣ Wallet balance check
    if (user.walletBalance < match.entryFee) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
        currentBalance: user.walletBalance,
        required: match.entryFee,
      });
    }

    // 9️⃣ Deduct entry fee
    user.walletBalance -= match.entryFee;
    await user.save();

    // 🔟 Assign slot number (increment by existing count)
    const existingTeamsCount = await Teams.countDocuments({ matchId });
    const slotNumber = existingTeamsCount + 1;

    // 1️⃣1️⃣ Create team
    await Teams.create({
      matchId,
      leaderId: userId,
      teamName,
      players,
      slotNumber,
    });

    return res.json({
      success: true,
      message: "Team registered successfully.",
      newWalletBalance: user.walletBalance,
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
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

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








