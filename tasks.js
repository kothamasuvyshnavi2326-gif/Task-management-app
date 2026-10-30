import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import requireAuth from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch { res.status(500).json({ message: 'Could not fetch tasks.' }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description = '', status = 'Todo', priority = 'Medium', dueDate = null } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Task title is required.' });
    const task = await Task.create({ user: req.userId, title: title.trim(), description, status, priority, dueDate: dueDate || null });
    res.status(201).json(task);
  } catch { res.status(400).json({ message: 'Invalid task data.' }); }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task id.' });
    const allowed = ['title', 'description', 'status', 'priority', 'dueDate'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.title !== undefined && !String(updates.title).trim()) return res.status(400).json({ message: 'Task title cannot be empty.' });
    if (updates.title !== undefined) updates.title = String(updates.title).trim();
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch { res.status(400).json({ message: 'Could not update task.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task id.' });
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch { res.status(500).json({ message: 'Could not delete task.' }); }
});

export default router;
