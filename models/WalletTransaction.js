import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    source: {
      type: String,
      enum: ["recharge", "match_prize", "highest_kill", "withdrawal"],
      required: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    balanceAfter: { type: Number },
  },
  { timestamps: true }
);

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);
export default WalletTransaction;
