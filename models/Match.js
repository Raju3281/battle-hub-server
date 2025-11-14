import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    matchName: { type: String, required: true },
    matchType: { type: String, enum: ["solo", "duo", "squad"], required: true },
    entryFee: { type: Number, required: true },
    prizePool: { type: Number, required: true },
    matchTime: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["upcoming", "ongoing", "completed"], default: "upcoming" },
    matchLink: {
      type: String,
      default: null,
    },
    prizeDistribution: [
      {
        rank: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    results: {
      winners: [
        {
          teamName: String,
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          rank: Number,
          kills: Number,
          prize: Number,
        },
      ],
      highestKill: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        prize: Number,
        teamName: String,
      },
      
      remarks: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedAt: Date,
    },
  },
  
  { timestamps: true }
);

const Match = mongoose.model("Match", matchSchema);
export default Match;
