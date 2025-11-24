import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";
import { sendMail } from "../utils/sendEmail.js";
import WalletTransaction from "../models/WalletTransaction.js";
// 🧩 Register new user (not admin)
export const registerUser = async (req, res) => {
  try {
    const { username, phone, email, password, referralCode } = req.body;

    // 1️⃣ Basic validation
    if (!username || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 3️⃣ Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()?_=+<>/.,;:'"-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include 1 uppercase and 1 special character",
      });
    }

    // 4️⃣ Check if username / email / phone already exist
    const usernameExists = await User.findOne({ username });
    const emailExists = await User.findOne({ email });
    const phoneExists = await User.findOne({ phone });

    if (usernameExists) {
      return res.status(400).json({
        message: "Username already taken, try with other username",
      });
    }
    if (emailExists) {
      return res.status(400).json({
        message: "Email already exists, try with other email",
      });
    }
    if (phoneExists) {
      return res.status(400).json({
        message: "Phone number already exists, try with other phone number",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✳️ Create user (but not saved yet)
    const newUser = new User({
      username,
      phone,
      email,
      password: hashedPassword,
      role: "user",
      referredBy: null,
    });
     const generatedCode =
      username.toUpperCase() + newUser._id.toString().slice(-4);

    newUser.referralCode = generatedCode;
    // 💸 Referral Logic — Only reward referrer, not new user
   if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode });

      if (referrer) {
        // 👉 Save referrer's _id in referredBy
        newUser.referredBy = referrer._id;

        // Add bonus to referrer
        referrer.referralBalance = (referrer.referralBalance || 0) + 5;
        await referrer.save();

        // Create Wallet Transaction
        await WalletTransaction.create({
          userId: referrer._id,
          type: "credit",
          amount: 5,
          status: "approved",
          source: "referral_bonus",
          balanceAfter: referrer.referralBalance,
        });
      }else{
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    // Save new user finally
    await newUser.save();

    // Remove password before sending response
    const { password: _, ...safeUser } = newUser.toObject();

    res.status(201).json({
      success: true,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🕵️ Find user by username OR phone
    const user = await User.findOne({
      $or: [{ email: email }],
    });

    if (!user) {
      return res.status(404).json({ message: "Email Doesn't Exist" });
    }

    // 🔐 Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ❌ Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked, Please contact admin" });
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


export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No account found with this email, Enter valid email" });
    }

    // 2️⃣ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Set expiry 10 mins
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4️⃣ Store OTP in DB (remove old)
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    // 5️⃣ Send using your existing sendMail.js
    await sendMail(
      email,
      "BattleHub Password Reset OTP",
      `
      <h2>BattleHub Password Reset</h2>
      <p>Your User name is: <b>${user.username}</p>
      <p>Your OTP to reset your password:</p>
      <h1 style="letter-spacing:4px;color:#FACC15;">${otp}</h1>
      <p>Valid for <b>10 minutes</b>.</p>
      <p>If you didn't request this, please ignore.</p>
      `
    );

    res.json({ success: true, message: "OTP sent successfully to your email." });

  } catch (error) {
    console.error("Forgot Password OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP. Try again later." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ success: true, message: "OTP verified" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashed });

    await Otp.deleteMany({ email }); // clear OTP

    res.json({ success: true, message: "Password reset successful!" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


