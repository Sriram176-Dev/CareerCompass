import { Task } from "../../models/Task.js";

// GET /api/tasks
export async function listTasks(req, res) {
  try {
    const tasks = await Task.find({ user_id: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/tasks
export async function createTask(req, res) {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Text required" });
    const task = await Task.create({ user_id: req.userId, text: text.trim() });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/tasks/:id
export async function updateTask(req, res) {
  try {
    const { completed, text } = req.body;
    const update = {};
    if (typeof completed === "boolean") update.completed = completed;
    if (text) update.text = text;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { $set: update },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/tasks/:id
export async function deleteTask(req, res) {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user_id: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
