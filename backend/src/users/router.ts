import { Router } from 'express';
import { pool } from '../db/client';
import { requireAuth } from '../auth/middleware';
import { getOnlineUserIds } from '../presence/service';

export const usersRouter = Router();

usersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    if (!req.user) { next(new Error('requireAuth missing')); return; }
    const { rows } = await pool.query<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM users WHERE id != $1 ORDER BY name',
      [req.user.userId]
    );
    const onlineIds = new Set(await getOnlineUserIds(rows.map((r) => r.id)));
    const users = rows.map((r) => ({ ...r, online: onlineIds.has(r.id) }));
    res.json({ users });
  } catch (err) {
    next(err);
  }
});
