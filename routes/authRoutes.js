import express from "express";
import { loginUser, registerUser, resetPassword, sendForgotPasswordOtp, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password-otp", sendForgotPasswordOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
