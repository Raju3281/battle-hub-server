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

  // Fetch the match
  const match = await Match.findById(matchId);
  if (!match) return res.status(404).json({ message: "Match not found" });

  // Validate: can't update a completed match
  if (match.status === "completed")
    return res.status(400).json({ message: "Match already completed!" });

  // Prepare new result data
  match.results = { winners, highestKill, remarks };
  match.status = "completed";
  match.results.updatedBy = req.user._id;
  match.results.updatedAt = new Date();

  // Detect transaction support
  let session = null;
  let useTransaction = false;
  try {
    session = await Match.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (err) {
    console.log("⚠️ MongoDB transaction not supported on this setup — using fallback mode.");
  }

  try {
    // 🧾 Function to credit user wallet
    const creditWallet = async (userId, amount, source) => {
      if (!userId || !amount || amount <= 0) return;

      const user = await User.findById(userId);
      if (!user) return;

      const newBalance = (user.walletBalance || 0) + amount;

      // Update balance
      await User.findByIdAndUpdate(userId, { walletBalance: newBalance });

      // Log transaction
      await WalletTransaction.create({
        userId,
        type: "credit",
        amount,
        source,
        referenceId: match._id,
        balanceAfter: newBalance,
      });
    };

    // 🏅 Credit all winners
    for (const winner of winners) {
      await creditWallet(winner.userId, winner.prize, "match_prize");
    }

    // 💀 Credit highest kill bonus
    if (highestKill?.userId && highestKill?.prize > 0) {
      await creditWallet(highestKill.userId, highestKill.prize, "highest_kill");
    }

    // 💾 Save match result
    await match.save();

    // Commit if transactions supported
    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    res.json({
      message: "✅ Match results updated successfully!",
      match,
    });
  } catch (error) {
    console.error("Error updating match results:", error);

    if (useTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }

    res.status(500).json({ message: "❌ Error updating match results", error: error.message });
  }
};
