import Room from "../models/Room.js";


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

    // Check if room already exists for this match
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

    return res.json({
      success: true,
      message: "Room details saved successfully ✔️",
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

