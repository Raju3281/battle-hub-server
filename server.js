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

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/results", resultRoutes);
import paymentRoutes from "./routes/paymentRoutes.js";

app.use("/api/payments", paymentRoutes);
app.use("/api/recharges", rechargeRoutes);
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
app.get("/", (req, res) => res.send("BattleHub API running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
