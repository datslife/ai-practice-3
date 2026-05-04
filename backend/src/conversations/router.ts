import { Router } from 'express';
import { pool } from '../db/client';
import { requireAuth } from '../auth/middleware';
import { listMessages } from '../messaging/service';

export const conversationsRouter = Router();

conversationsRouter.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    if (!req.user) { next(new Error('requireAuth missing')); return; }

    const { id } = req.params;
    const userId = req.user.userId;

    // Verify requester is a participant of the conversation
    const { rows } = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)',
      [id, userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : undefined;

    const messages = await listMessages(id, limit, offset);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});
