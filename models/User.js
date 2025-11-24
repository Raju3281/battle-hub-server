import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    walletBalance: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    upi: { type: String },
    email: { type: String, required: true, unique: true },
    referralCode: { type: String, required: false, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    referralBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
