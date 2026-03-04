const failedAttempts = {};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const ip = req.headers['x-forwarded-for'] || 'unknown_ip';

  if (!failedAttempts[ip]) {
    failedAttempts[ip] = { count: 0, lockedUntil: 0 };
  }

  const userRecord = failedAttempts[ip];

  if (Date.now() < userRecord.lockedUntil) {
    const timeLeft = Math.ceil((userRecord.lockedUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({ 
      success: false, 
      banned: true,
      message: IP заблокирован. Попробуйте через ${timeLeft} мин. 
    });
  }

  try {
    const { password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const securePassword = process.env.ADMIN_PASS;

    if (!securePassword) {
      return res.status(500).json({ message: "Ошибка: ADMIN_PASS не настроен в Vercel" });
    }

    if (password === securePassword) {
      userRecord.count = 0;
      return res.status(200).json({ success: true });
    } else {
      userRecord.count += 1;
      if (userRecord.count >= 3) {
        userRecord.lockedUntil = Date.now() + 15 * 60 * 1000;
        return res.status(429).json({ success: false, banned: true, message: "Слишком много попыток. БАН 15 мин." });
      }
      return res.status(401).json({ success: false, message: Неверно. Попыток: ${3 - userRecord.count} });
    }
  } catch (error) {
    return res.status(400).json({ message: "Ошибка данных" });
  }
}