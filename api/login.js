/* eslint-env node */
const failedAttempts = {}; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Метод не разрешен' });

  const ip = req.headers['x-forwarded-for'] || '127.0.0.1';
  if (!failedAttempts[ip]) failedAttempts[ip] = { count: 0, lockedUntil: 0 };

  const now = Date.now();
  if (now < failedAttempts[ip].lockedUntil) {
    return res.status(429).json({ success: false, banned: true, message: 'IP заблокирован на 15 мин.' });
  }

  // Парсим пароль правильно
  let userPass = typeof req.body === 'string' ? JSON.parse(req.body).password : req.body?.password;
  const adminPass = process.env.VITE_ADMIN_PASS;

  if (userPass && userPass === adminPass) {
    failedAttempts[ip].count = 0;
    return res.status(200).json({ success: true });
  } else {
    failedAttempts[ip].count++;
    if (failedAttempts[ip].count >= 3) {
      failedAttempts[ip].lockedUntil = now + 15 * 60 * 1000;
      return res.status(429).json({ success: false, banned: true, message: 'Превышен лимит попыток!' });
    }
    return res.status(401).json({ success: false, message: 'Неверный пароль!' });
  }
}