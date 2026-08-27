// Admin guard. Only timedashy@gmail.com may access /admin resources.
import supabase from '../../api/db-client.js';

export const ADMIN_EMAIL = 'timedashy@gmail.com';

export async function getAuthUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function requireAdmin(req) {
  const user = await getAuthUser(req);
  if (!user || (user.email || '').toLowerCase() !== ADMIN_EMAIL) return null;
  return user;
}
