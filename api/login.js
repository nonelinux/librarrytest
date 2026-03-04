const failedAttempts = {};

export default async function handler(req, res) {
  // 1. Проверка метода
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const ip = req.headers['x-forwarded-for'] || 'unknown';
  if (!failedAttempts[ip]) failedAttempts[ip] = { count: 0, lockedUntil: 0 };

  // 2. Проверка бана
  if (Date.now() < failedAttempts[ip].lockedUntil) {
    return res.status(429).json({ success: false, banned: true, message: "Забанен на 15 мин" });
  }

  try {
    // 3. ГИБКИЙ ПАРСИНГ ПАРОЛЯ
    let password;
    if (typeof req.body === 'string') {
      try {
        password = JSON.parse(req.body).password;
      } catch (e) {
        password = req.body; // если пришла просто строка
      }
    } else {
      password = req.body?.password;
    }

    const securePassword = process.env.ADMIN_PASS;

    if (password && password === securePassword) {
      failedAttempts[ip].count = 0;
      return res.status(200).json({ success: true });
    } else {
      failedAttempts[ip].count++;
      if (failedAttempts[ip].count >= 3) {
        failedAttempts[ip].lockedUntil = Date.now() + 15 * 60 * 1000;
        return res.status(429).json({ success: false, banned: true, message: "Превышен лимит попыток" });
      }
      return res.status(401).json({ success: false, message: "Неверный пароль" });
    }
  } catch (error) {
    // Если всё совсем плохо, выводим ошибку для отладки
    return res.status(200).json({ success: false, message: "Ошибка данных на сервере" });
  }
}