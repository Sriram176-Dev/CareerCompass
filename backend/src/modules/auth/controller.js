import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../../models/User.js";
import { sendPasswordResetEmail } from "../../services/emailService.js";

const TOKEN_EXPIRY = "24h"; // Shortened from 30d

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

function signToken(userId) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable must be set");
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY, algorithm: "HS256" });
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password, name, user_type } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "Missing fields" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const existing = await User.findOne({ email });
    
    if (existing) {
      return res.status(409).json({ error: "Email already in use. Please login." });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({ 
      email, 
      password: hashed, 
      name, 
      user_type: user_type || "school_student",
    });

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user._id.toString());
    const profile = user.toObject();
    delete profile.password;

    res.cookie("cc_token", token, COOKIE_OPTIONS);
    res.json({ user: profile });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/auth/logout
export function logout(req, res) {
  const { maxAge, ...clearOptions } = COOKIE_OPTIONS;
  res.clearCookie("cc_token", clearOptions);
  res.json({ message: "Logged out successfully" });
}

// POST /api/auth/forgot-password
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If the email exists, a reset link was sent." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();

    await sendPasswordResetEmail(email, token);
    res.json({ message: "If that email exists, a reset link has been sent. Check your inbox (or console if in DEV)." });
  } catch (err) {
    if (err.isEmailSendError) {
      return res.json({ message: "Email failed to send (check server console for the reset link)." });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/auth/me
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId).select("-password -resetToken -resetTokenExpiry");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
