import { auth } from '../firebase';

/**
 * POST to one of our /api functions with the signed-in user's ID token.
 * Throws an Error with the server's message on failure.
 */
export async function callApi(path, body = {}) {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();

  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error. Check your connection.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
