import express from 'express';
import projectsRouter from './projects';
import topupRouter from './topup';
import adminTopupRouter from './admin/topup';
import walletRouter from './wallet';
import notificationsRouter from './notifications';

const router = express.Router();

router.use('/projects', projectsRouter);
router.use('/topup', topupRouter);
router.use('/admin/topup', adminTopupRouter);
router.use('/wallet', walletRouter);
router.use('/notifications', notificationsRouter);

router.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

export default router;
