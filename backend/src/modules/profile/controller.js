import { z } from "zod";
import { User } from "../../models/User.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const ProfileUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  user_type: z.enum(["school_student", "college_student", "working_professional"]).optional(),
  current_class: z.string().max(50).optional(),
  institution: z.string().max(200).optional(),
  city_tier: z.string().optional(),
  board: z.string().optional(),
  onboarding_complete: z.boolean().optional(),
  selected_career_id: z.number().optional(),
  // Add other fields as needed...
}).passthrough(); // Allow other fields from the allowlist for now

const AddXpSchema = z.object({
  amount: z.number().int().min(1).max(200),
});

const ALLOWED_PROFILE_FIELDS = new Set([
  "name", "user_type", "current_class", "institution", "city_tier", "board",
  "subjects", "selected_career_id", "selected_career", "saved_careers",
  "analysis_result", "interest_cards", "priority_ranking", "roadmap_data",
  "roadmap_generated_at", "completed_tasks", "quiz_attempts",
  "career_selection_events", "simulator_results",
  "onboarding_complete", "flashcard_decks", "saved_exam_names",
  "last_check_in", "streak", "notifications", "bookmarked_messages"
]);

const DAILY_XP_CAP = 2000;

// GET /api/profile
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select("-password -resetToken -resetTokenExpiry");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/profile
export async function updateProfile(req, res) {
  try {
    const validated = ProfileUpdateSchema.safeParse(req.body);
    if (!validated.success) return res.status(400).json({ error: "Invalid data", details: validated.error.format() });

    const updates = {};
    for (const [key, val] of Object.entries(req.body)) {
      if (ALLOWED_PROFILE_FIELDS.has(key)) updates[key] = val;
    }
    
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true }
    ).select("-password -resetToken -resetTokenExpiry");
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/profile/add-xp
export async function addXp(req, res) {
  try {
    const validated = AddXpSchema.safeParse(req.body);
    if (!validated.success) return res.status(400).json({ error: "Invalid XP amount (1-200 per call)" });

    const { amount } = validated.data;
    const today = new Date().toISOString().split('T')[0];

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });

    // Reset daily XP if it's a new day
    if (user.last_xp_date !== today) {
      user.xp_today = 0;
      user.last_xp_date = today;
    }

    // Check cap
    if (user.xp_today >= DAILY_XP_CAP) {
      return res.status(429).json({ error: "Daily XP limit reached. Keep learning but XP will resume tomorrow!" });
    }

    const xpToGain = Math.min(amount, DAILY_XP_CAP - user.xp_today);
    
    user.xp = (user.xp || 0) + xpToGain;
    user.xp_today += xpToGain;
    user.level = Math.floor(user.xp / 150) + 1;
    
    await user.save();
    res.json({ xp: user.xp, level: user.level, gained: xpToGain });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/profile/chat-session — save a full chat session
export async function saveChatSession(req, res) {
  try {
    const { session } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });

    const idx = user.chat_sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      user.chat_sessions[idx] = session;
    } else {
      user.chat_sessions.unshift(session);
      // Keep only last 20 sessions
      if (user.chat_sessions.length > 20) user.chat_sessions = user.chat_sessions.slice(0, 20);
    }
    user.markModified("chat_sessions");
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/profile/chat-session/:id
export async function deleteChatSession(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    user.chat_sessions = user.chat_sessions.filter((s) => s.id !== req.params.id);
    user.markModified("chat_sessions");
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/profile/flashcard-deck — atomically push a new deck
export async function pushFlashcardDeck(req, res) {
  try {
    const { deck } = req.body;
    if (!deck || !deck.id) return res.status(400).json({ error: "Deck required" });

    // Use $push for atomic append — avoids race condition from client-side read-modify-write
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: {
          flashcard_decks: {
            $each: [deck],
            $slice: -50, // keep last 50 decks max
          },
        },
      },
      { new: true }
    ).select("-password -resetToken -resetTokenExpiry");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, flashcard_decks: user.flashcard_decks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/profile/flashcard-deck/:id — update a single deck's progress atomically
export async function updateFlashcardDeckProgress(req, res) {
  try {
    const { progress } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.userId, "flashcard_decks.id": req.params.id },
      { $set: { "flashcard_decks.$.progress": progress } },
      { new: true }
    ).select("flashcard_decks");
    if (!user) return res.status(404).json({ error: "Deck not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
