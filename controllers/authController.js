import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
// 🧩 Register new user (not admin)
export const registerUser = async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    // 1️⃣ Basic validation
    if (!username || !phone || !password)
      return res.status(400).json({ message: "All fields are required" });

    // 2️⃣ Check for existing user
    const exists = await User.findOne({ $or: [{ username }, { phone }] });
    if (exists)
      return res.status(400).json({ message: "Username or phone already taken" });

    // 3️⃣ Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 4️⃣ Create user (default role: user)
    const user = await User.create({
      username,
      phone,
      password: hashed,
      role: "user",
    });

    // 5️⃣ Remove password before sending response
    const { password: _, ...safeUser } = user.toObject();

    res.status(201).json({
      message: "User registered successfully 🎉",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { usernameOrPhone, password } = req.body;

    if (!usernameOrPhone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🕵️ Find user by username OR phone
    const user = await User.findOne({
      $or: [{ username: usernameOrPhone }, { phone: usernameOrPhone }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ❌ Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    // 🎟️ Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // 🚀 Response
    const { password: _, ...safeUser } = user.toObject();

    res.status(200).json({
      message: "Login successful ✅",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
