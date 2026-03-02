import express from 'express';
import { supabase } from '../../utils/supabase';

const router = express.Router();

router.get('/download', async (req, res) => {
  try {
    const tables = [
      'users',
      'projects',
      'transactions',
      'top_up_requests',
      'messages',
      'settings',
      'notifications',
      'pricing_plans'
    ];

    const backup: any = {};

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`Error fetching table ${table}:`, error);
        backup[table] = { error: error.message };
      } else {
        backup[table] = data;
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (error: any) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to generate backup', details: error.message });
  }
});

export default router;
