import Payment from "../models/Payment.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

// 🧾 User uploads payment proof
export const uploadPayment = async (req, res) => {
  try {
    // Safely read req.body (could be undefined)
    console.log("Request Body:", req.body);
    const body = req.body || {};

    // Prefer authenticated user id (set by verifyToken middleware)
    const authUserId = req.user?.id || req.user?.userId || null;

    // Accept userId from body only if auth is not present (but prefer auth)
    const userId = authUserId || body.userId;

    const amount = body.amount ?? (body?.amount === 0 ? 0 : undefined);
    const screenshotUrl = body.screenshotUrl;

    // Validate
    if (!userId) {
      return res.status(400).json({ message: "userId is required (or ensure valid auth token)" });
    }
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ message: "Valid amount is required" });
    }
    if (!screenshotUrl) {
      return res.status(400).json({ message: "screenshotUrl is required" });
    }
    if (amount <20 ||amount < '20') {
      return res.status(400).json({ message: "Minimum Rs.50 is required" });
    }

    // Create payment record (adjust fields to your model)
    const payment = await Payment.create({
      userId,
      amount: Number(amount),
      screenshotUrl,
      status: "pending",
      createdAt: new Date(),
    });

    return res.status(201).json({
      message: "Recharge uploaded successfully (awaiting admin approval)",
      payment,
    });
  } catch (error) {
    console.error("Error uploading payment:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// ✅ Admin approves or rejects payment
export const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const payment = await Payment.findById(id);
    if (!payment)
      return res.status(404).json({ message: "Payment not found" });

    // Already processed?
    if (payment.status !== "pending")
      return res.status(400).json({ message: "Payment already processed" });

    payment.status = status;
    payment.approvedBy = req.user.id;
    payment.remarks = remarks || "";

    await payment.save();

    // 💰 On approval, add balance to user's wallet (example field)
    if (status === "approved") {
      await User.findByIdAndUpdate(payment.userId, {
        $inc: { balance: payment.amount },
      });
    }

    res.status(200).json({
      message: `Payment ${status === "approved" ? "approved" : "rejected"} successfully`,
      payment,
    });
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🧾 Get all pending payments (Admin)
export const getPendingPayments = async (req, res) => {
  try {
    const pending = await WalletTransaction.find({ status: "pending" })
      .populate("userId", "username phone upi")
      .populate("matchId", "matchName matchType prizePool");
    res.status(200).json(pending);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * ❌ Reject payment
 * - Marks payment as rejected
 * - Optionally saves reason
 */
export const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status === "approved")
      return res
        .status(400)
        .json({ message: "Approved payments cannot be rejected" });

    if (payment.status === "rejected")
      return res.status(400).json({ message: "Payment already rejected" });

    // Update payment status
    payment.status = "rejected";
    payment.rejectionReason = reason || "No reason provided";
    await payment.save();

    res.json({
      message: `❌ Payment of ₹${payment.amount} rejected successfully`,
      payment,
    });
  } catch (error) {
    console.error("Error rejecting payment:", error);
    res
      .status(500)
      .json({ message: "❌ Failed to reject payment", error: error.message });
  }
};


export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT middleware

    const user = await User.findById(userId).select("walletBalance");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      balance: user.walletBalance,
      referralBalance: user.referralBalance,
    });
  } catch (err) {
    console.error("Wallet API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching wallet balance",
    });
  }
};


