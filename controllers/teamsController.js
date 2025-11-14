import Teams from "../models/Teams.js";

export const getTeamsByMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const teams = await Teams.find({ matchId })
      .select("teamName leaderId players");

    return res.json({
      success: true,
      teams,
    });

  } catch (err) {
    console.error("Team Fetch Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
