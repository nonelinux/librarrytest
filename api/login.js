// Простая база в памяти для хранения ошибок
const failedAttempts = {};

export default function handler(req, res) {
  // 1. Разрешаем только метод POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Только POST запросы' });
  }

  // 2. Получаем IP-адрес пользователя (Vercel передает его в заголовках)
  const ip = req.headers['x-forwarded-for'] || '127.0.0.1';

  // Если этого IP еще нет в нашей "базе", создаем его
  if (!failedAttempts[ip]) {
    failedAttempts[ip] = { count: 0, lockedUntil: 0 };
  }

  const now = Date.now();

  // 3. ПРОВЕРКА БАНА: Если время блокировки еще не прошло - отшиваем
  if (now < failedAttempts[ip].lockedUntil) {
    return res.status(429).json({ success: false, message: 'Ваш IP заблокирован на 15 минут.' });
  }

  // 4. Достаем пароль, который ввел пользователь, и настоящий из Vercel
  const userPassword = req.body.password;
  const realPassword = process.env.VITE_ADMIN_PASS;

  // 5. ПРОВЕРКА ПАРОЛЯ
  if (userPassword && userPassword === realPassword) {
    // Пароль верный -> сбрасываем ошибки и пускаем
    failedAttempts[ip].count = 0;
    return res.status(200).json({ success: true, message: 'Доступ разрешен' });
  } else {
    // Пароль неверный -> прибавляем ошибку
    failedAttempts[ip].count += 1;

    // Если ошибок 3 или больше -> БАН на 15 минут
    if (failedAttempts[ip].count >= 3) {
      failedAttempts[ip].lockedUntil = now + (15 * 60 * 1000); // 15 минут
      return res.status(429).json({ success: false, message: 'Бан на 15 минут за подбор пароля!' });
    }

    // Если попытки еще есть
    return res.status(401).json({ success: false, message: 'Неверный пароль!' });
  }
}