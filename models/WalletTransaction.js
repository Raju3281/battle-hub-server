import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected","joined"],
      default: "pending",
    },
    // credit = user adds money
    // debit = user spends money / withdrawal
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
    matchId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Match",
  required: false,
},

    // recharge → while uploading screenshot
    // match_prize → winnings
    // highest_kill → bonus
    // withdrawal → user withdrawal
    source: {
      type: String,
      enum: ["recharge", "match_prize", "highest_kill", "withdrawal"],
      required: true,
    },

    // Save screenshot only for recharge type
    screenshot: {
      data: Buffer,         // binary file
      contentType: String,  // image/jpeg,image/png etc
    },

    // For linking another entity: match, withdrawal req, etc
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Wallet balance after this transaction
    balanceAfter: {
      type: Number,
    },
  },
  { timestamps: true }
);

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);

export default WalletTransaction;
