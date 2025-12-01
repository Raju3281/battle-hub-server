import Match from "../models/Match.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

/**
 * 🏆 Update match results and distribute rewards
 * - Only accessible by Admins
 * - Automatically handles wallet credits
 * - Works without replica sets (local dev safe)
 */
export const updateMatchResults = async (req, res) => {
  const { matchId } = req.params;
  const { winners = [], highestKill = {}, remarks = "" } = req.body;

  if (!matchId) return res.status(400).json({ message: "Match ID is required" });

  // Fetch match
  const match = await Match.findById(matchId);
  if (!match) return res.status(404).json({ message: "Match not found" });

  if (match.status === "completed")
    return res.status(400).json({ message: "Match already completed!" });

  try {
    // Save results
    match.results = { winners, highestKill, remarks };
    match.status = "completed";
    match.results.updatedBy = req.user._id;
    match.results.updatedAt = new Date();
    await match.save();

    // 🧾 Function to credit wallet (Simple version)
    const creditWallet = async (userId, amount, source) => {
      if (!userId || !amount || amount <= 0) return;

      const user = await User.findById(userId);
      if (!user) return;

      user.walletBalance = Number(user.walletBalance || 0) + Number(amount);
      await user.save();

      await WalletTransaction.create({
        userId,
        type: "credit",
        amount,
        source,
        referenceId: match._id,
        status: "approved",
        balanceAfter: user.walletBalance,
      });
    };

    // 🏅 Credit all winners
    for (const winner of winners) {
      await creditWallet(winner.leaderId, winner.prize, "match_prize");
    }

    // 💀 Credit highest kill bonus
    if (highestKill?.userId && highestKill?.prize > 0) {
      await creditWallet(highestKill.userId, highestKill.prize, "highest_kill");
    }

    return res.json({
      message: "🏆 Match results updated & prizes credited successfully!",
      match,
    });
  } catch (error) {
    console.error("Error updating match results:", error);
    return res.status(500).json({
      message: "❌ Error updating match results",
      error: error.message,
    });
  }
};


