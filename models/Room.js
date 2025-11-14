import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      unique: true, // One room per match
    },

    roomId: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      default: null,
    },

    // Optional fields for future expansion
    server: { type: String, default: "" },
    map: { type: String, default: "" },
    notes: { type: String, default: "" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
