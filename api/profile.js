// Upsert a profile row when a user signs in (mirrors auth.users with a role).
import supabase from './db-client.js';
import { preflight } from './lib/cors.js';

const ADMIN_EMAIL = 'timedashy@gmail.com';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid session' });

    const role = (user.email || '').toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
    const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', user.id).limit(1);
    if (existing && existing.length) {
      await supabase.from('profiles').update({ email: user.email, role }).eq('user_id', user.id);
      return res.status(200).json({ user_id: user.id, email: user.email, role });
    }
    const { data } = await supabase.from('profiles').insert({ user_id: user.id, email: user.email, role }).select().single();
    return res.status(200).json(data || { user_id: user.id, email: user.email, role });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ error: err.message });
  }
}
