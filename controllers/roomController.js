import Room from "../models/Room.js";


import Teams from "../models/Teams.js";       // ⬅️ adjust path if needed
import { sendMail } from "../utils/sendEmail.js"; // ⬅️ your existing mail util
import Match from "../models/Match.js";     // optional, just to show match name

export const updateRoomDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { roomId, password, server, map, notes } = req.body;
    const adminId = req.user.id; // Admin ID from token

    if (!roomId || !password) {
      return res.status(400).json({
        success: false,
        message: "Room ID and Password are required",
      });
    }

    // 🔹 1. Create / Update Room
    let room = await Room.findOne({ matchId });

    if (!room) {
      // Create new room
      room = await Room.create({
        matchId,
        roomId,
        password,
        server: server || "",
        map: map || "",
        notes: notes || "",
        createdBy: adminId,
      });
    } else {
      // Update existing
      room.roomId = roomId;
      room.password = password;
      room.server = server || "";
      room.map = map || "";
      room.notes = notes || "";
      await room.save();
    }

    // 🔹 2. Fetch match (for name & time in mail – optional)
    let match = null;
    try {
      match = await Match.findById(matchId);
    } catch (e) {
      console.warn("Match not found for email context, continuing without it.");
    }

    // 🔹 3. Fetch all teams in this match, with leader details
    const teams = await Teams.find({ matchId }).populate("leaderId", "email username");
   const parseDate = (value) => {
  if (!value) return null;

  if (!isNaN(Number(value))) {
    const num = Number(value);
    const ms = num.toString().length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;

  return null;
};
    // 🔹 4. Send mail to each leader (who has an email)
    const emailPromises = teams.map((team) => {
      const leader = team.leaderId;
      if (!leader || !leader.email) return null;

      const subject = `Room Details for ${match?.matchName || "BattleHub Match"}`;
 const FIVE_HOURS_30_MIN = 5.5 * 60 * 60 * 1000;  // 5h 30m
           const matchDate= parseDate(match.matchTime)
            const FIFTEEN_MIN = 15 * 60 * 1000;

            // const regEnd = new Date(matchDate.getTime() - FIVE_HOURS_30_MIN);
            const regEnd = new Date(matchDate.getTime() - FIVE_HOURS_30_MIN);

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color:#FACC15; margin-bottom: 8px;">BattleHub Room Details</h2>
          <p>Hi <b>${leader.username || "Player"}</b>,</p>
          <p>Here are the room details for your upcoming match${match?.matchName ? ` <b>${match.matchName}</b>` : ""
        }:</p>

          <ul style="list-style:none;padding-left:0;">
            <li><b>Room ID:</b> ${room.roomId}</li>
            <li><b>Password:</b> ${room.password}</li>
            ${room.server ? `<li><b>Server:</b> ${room.server}</li>` : ""}
            ${room.map ? `<li><b>Map:</b> ${room.map}</li>` : ""}
          </ul>

          ${match?.matchTime
          ? `<p><b>Match Time:</b> ${new Date(regEnd).toLocaleString(
            "en-IN",
            { hour12: true }
          )}</p>`
          : ""
        }

          ${room.notes
          ? `<p style="margin-top:8px;"><b>Notes:</b> ${room.notes}</p>`
          : ""
        }

          <p style="margin-top:16px;">All the best for your match! 🔥</p>
          <p>Regards,<br/>BattleHub Admin</p>
        </div>
      `;

      return sendMail(leader.email, subject, html);
    }).filter(Boolean); // remove nulls

    // fire all emails in parallel, but don't block response forever if some fail
    Promise.allSettled(emailPromises).then((results) => {
      const failed = results.filter(r => r.status === "rejected").length;
      if (failed > 0) {
        console.error(`Failed to send ${failed} room emails.`);
      }
    });

    return res.json({
      success: true,
      message: "Room details saved & emailed to team leaders ✔️",
      room,
    });

  } catch (err) {
    console.error("Room save error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



export const getRoomDetails = async (req, res) => {
  try {
    const { matchId } = req.params;

    const room = await Room.findOne({ matchId });

    if (!room) {
      return res.json({
        success: true,
        room: null,
        message: "Room details not added yet",
      });
    }

    return res.json({
      success: true,
      room,
    });

  } catch (err) {
    console.error("Room Fetch Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

