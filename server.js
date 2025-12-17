import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { verifyAdmin, verifyToken } from "./middlewares/authMiddleware.js";
import matchRoutes from "./routes/matchRoutes.js";
import rechargeRoutes from "./routes/rechargeRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import calenderRoutes from "./routes/calenderRoutes.js";
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb'  }));
// Routes

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/recharges", rechargeRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/calendar", calenderRoutes);
app.get("/api/user/profile", verifyToken, (req, res) => {
  res.json({
    message: "✅ Welcome to your profile!",
    user: req.user,
  });
});

// 🧩 Example Admin route (requires admin role)
app.get("/api/admin/dashboard", verifyAdmin, (req, res) => {
  res.json({
    message: "🛡️ Welcome Admin!",
    user: req.user,
  });
});
app.use((req, res, next) => {
  console.log("=== REQUEST DEBUG ===");
  console.log("URL:", req.originalUrl);
  console.log("Method:", req.method);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  // Only log small bodies to avoid huge logs
  let size = req.headers['content-length'] || 'unknown';
  console.log("Content-Length:", size);
  // Attempt to print body — may be undefined if not parsed yet
  console.log("Body (may be undefined):", req.body);
  console.log("=====================");
  next();
});
app.get("/", (req, res) => res.send("BattleHub API running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));