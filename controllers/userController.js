import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

/**
 * 👥 Get all registered users (except admins)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      message: "✅ Registered users fetched successfully!",
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "❌ Failed to fetch users", error: error.message });
  }
};

/**
 * 🚫 Block a user
 * - Admin can block any user
 */
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: `🚫 User ${user.username} has been blocked successfully!`,
      user,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "❌ Failed to block user", error: error.message });
  }
};

/**
 * ✅ Unblock a user
 * - Admin can restore access
 */
export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: `✅ User ${user.username} has been unblocked successfully!`,
      user,
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "❌ Failed to unblock user", error: error.message });
  }
};

/**
 * 💰 Get user's wallet balance and transaction history
 */
export const getUserWallet = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await WalletTransaction.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      message: "💰 Wallet details fetched successfully!",
      walletBalance: user.walletBalance,
      totalTransactions: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching wallet info:", error);
    res.status(500).json({ message: "❌ Failed to fetch wallet info", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { upiId } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.upi = upiId || user.upi;
    await user.save();
    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server Error" });
  }
}


export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server Error" });
  }
}
