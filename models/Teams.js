// models/Team.js
import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  playerName: {
    type: String,
    required: true,
  },
  inGameId: {
    type: String, // BGMI/PUBG ID
    required: true,
  },
  isLeader: {
    type: Boolean,
    default: false,
  }
});

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
    },

    // ✔ Leader ID stored separately for quick access
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Match ID the team booked for
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    slotNumber: {
    type: Number,
    required: true
    },
    // ✔ Includes leader as one of the 4 players
    players: {
      type: [playerSchema],
      validate: {
        validator: function (v) {
          return v.length === 4; // must be exactly 4 players
        },
        message: "Team must have exactly 4 players."
      }
    },
  },
  { timestamps: true }
);

export default mongoose.model("Teams", teamSchema);
