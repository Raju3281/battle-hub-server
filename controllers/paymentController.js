import Payment from "../models/Payment.js";
import User from "../models/User.js";

// 🧾 User uploads payment proof
export const uploadPayment = async (req, res) => {
  try {
    const { matchId, amount, screenshotUrl } = req.body;

    if (!matchId || !amount || !screenshotUrl)
      return res.status(400).json({ message: "All fields are required" });

    const payment = await Payment.create({
      userId: req.user.id,
      matchId,
      amount,
      screenshotUrl,
    });

    res.status(201).json({
      message: "Payment uploaded successfully ✅ (Awaiting admin approval)",
      payment,
    });
  } catch (error) {
    console.error("Error uploading payment:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
    const pending = await Payment.find({ status: "pending" })
      .populate("userId", "username phone")
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

