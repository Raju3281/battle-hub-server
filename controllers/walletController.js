import WalletTransaction from "../models/WalletTransaction.js";
import User from "../models/User.js";



export const createRechargeTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Recharge Request Body:", req.file);
        console.log("Recharge Request Body:", req.body);

    const amount = Number(req.body.amount);

    if (!req.file) {
      return res.status(400).json({ message: "Screenshot required" });
    }

    const tx = await WalletTransaction.create({
      userId,
      type: "credit",
      source: "recharge",
      amount,
      screenshot: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });

    res.status(201).json({ message: "Recharge request submitted", tx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


export const updateWalletTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get transaction
    const tx = await WalletTransaction.findById(id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (tx.status !== "pending") {
      return res.status(400).json({ message: "Transaction already processed" });
    }

    // APPROVE FLOW
    if (status === "approved") {
      // Only recharge should add balance
      if (tx.type !== "credit" || tx.source !== "recharge") {
        return res.status(400).json({ message: "Only recharge can be approved" });
      }

      const user = await User.findById(tx.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.walletBalance = (user.walletBalance || 0) + tx.amount;
      await user.save();

      tx.status = "approved";
      tx.balanceAfter = user.walletBalance;
      await tx.save();

      return res.json({
        message: "Transaction approved successfully",
        balance: user.walletBalance,
        transaction: tx,
      });
    }

    // REJECT FLOW
    if (status === "rejected") {
      tx.status = "rejected";
      await tx.save();

      return res.json({
        message: "Transaction rejected successfully",
        transaction: tx,
      });
    }

  } catch (error) {
    console.error("Wallet Status Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
