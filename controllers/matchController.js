import Match from "../models/Match.js";

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



