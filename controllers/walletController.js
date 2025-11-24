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
        const amount = req.body.amount !== undefined ? Number(req.body.amount) : 0;
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
             if(tx.type === "debit" && tx.source === "withdrawal") {



                const user = await User.findById(tx.userId);
                if (!user) return res.status(404).json({ message: "User not found" });

                tx.status = "approved";
                tx.amount = amount !== 0 ? amount : tx.amount;;
                tx.balanceAfter = user.walletBalance;
                await tx.save();
                return res.json({
                message: "Withdrawal approved successfully",
                balance: user.walletBalance,
                transaction: tx,
            });
            }
            //   if (tx.type !== "credit" || tx.source !== "recharge") {
            //     return res.status(400).json({ message: "Only recharge can be approved" });
            //   }

            const user = await User.findById(tx.userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            const finalAmount = amount !== 0 ? amount : tx.amount;

            user.walletBalance = Number(user.walletBalance) + Number(finalAmount);
            await user.save();

            tx.status = "approved";
            tx.amount = finalAmount;
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

            const user = await User.findById(tx.userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            // Refund only if it's a withdrawal
            if (tx.type === "debit" && tx.source === "withdrawal") {
                user.walletBalance = Number(user.walletBalance) + Number(tx.amount);
                await user.save();
            }

            tx.status = "rejected";
            tx.balanceAfter = user.walletBalance;
            await tx.save();

            return res.json({
                message: "Transaction rejected successfully",
                refunded: tx.type === "debit" && tx.source === "withdrawal" ? tx.amount : 0,
                balance: user.walletBalance,
                transaction: tx,
            });
        }


    } catch (error) {
        console.error("Wallet Status Update Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const withdrawalRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (amount > user.walletBalance) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }
        if(amount <50 || amount < '50') {
          return res.status(400).json({ message: "Minimum Rs.50 required for withdrawal" });
        }
        const tx = await WalletTransaction.create({
            userId,
            type: "debit",
            source: "withdrawal",
            amount,
        });

        // Deduct balance
        user.walletBalance = Number(user.walletBalance) - Number(amount);
        await user.save();
        // tx.status = "approved";
        tx.balanceAfter = user.walletBalance;
        await tx.save();
        res.status(201).json({ message: "Withdrawal request successful", tx, balance: user.walletBalance });
    } catch (err) {
        console.error("Withdrawal Request Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getWalletHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // validate
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // fetch all transactions of user
    const transactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 }) // newest first
     .select("-screenshot");
    return res.json({
      success: true,
      transactions,
    });

  } catch (error) {
    console.error("Wallet History Error:", error);
    res.status(500).json({ message: "Server error while fetching history" });
  }
};

