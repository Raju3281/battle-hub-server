import Recharge from "../models/Recharge.js";
import User from "../models/User.js";

// 🧾 User uploads wallet recharge proof
export const uploadRecharge = async (req, res) => {
  try {
    const { amount, screenshotUrl } = req.body;

    if (!amount || !screenshotUrl)
      return res.status(400).json({ message: "All fields are required" });

    const recharge = await Recharge.create({
      userId: req.user.id,
      amount,
      screenshotUrl,
    });

    res.status(201).json({
      message: "Recharge request submitted successfully ✅ (Awaiting admin approval)",
      recharge,
    });
  } catch (error) {
    console.error("Error uploading recharge:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🧾 Admin views all pending recharges
export const getPendingRecharges = async (req, res) => {
  try {
    const recharges = await Recharge.find({ status: "pending" })
      .populate("userId", "username phone balance")
      .sort({ createdAt: -1 });

    res.status(200).json(recharges);
  } catch (error) {
    console.error("Error fetching recharges:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Admin approves/rejects recharge
export const approveRecharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const recharge = await Recharge.findById(id);
    if (!recharge) return res.status(404).json({ message: "Recharge not found" });
    if (recharge.status !== "pending")
      return res.status(400).json({ message: "Recharge already processed" });

    recharge.status = status;
    recharge.approvedBy = req.user.id;
    recharge.remarks = remarks || "";
    await recharge.save();

    if (status === "approved") {
      // 💰 Add to user's wallet
      await User.findByIdAndUpdate(recharge.userId, {
        $inc: { balance: recharge.amount },
      });
    }

    res.status(200).json({
      message: `Recharge ${status === "approved" ? "approved" : "rejected"} successfully`,
      recharge,
    });
  } catch (error) {
    console.error("Error approving recharge:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 💰 Get user recharge history
export const getUserRecharges = async (req, res) => {
  try {
    const recharges = await Recharge.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(recharges);
  } catch (error) {
    console.error("Error fetching user recharges:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
