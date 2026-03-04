// Память сервера для хранения попыток (сбрасывается при перезагрузке проекта)
const failedAttempts = {};

export default async function handler(req, res) {
  // 1. Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  // Получаем IP пользователя для блокировки
  const ip = req.headers['x-forwarded-for'] || 'unknown_ip';

  // Инициализируем запись для этого IP, если её нет
  if (!failedAttempts[ip]) {
    failedAttempts[ip] = { count: 0, lockedUntil: 0 };
  }

  const userRecord = failedAttempts[ip];

  // 2. ПРОВЕРКА НА БАН
  if (Date.now() < userRecord.lockedUntil) {
    const timeLeft = Math.ceil((userRecord.lockedUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({ 
      success: false, 
      banned: true,
      message: ХАКЕР ЗАБАНЕН! Попробуй через ${timeLeft} мин. 
    });
  }

  try {
    // 3. ПОЛУЧАЕМ ПАРОЛЬ (с поддержкой разных форматов данных)
    let password;
    if (typeof req.body === 'string') {
      password = JSON.parse(req.body).password;
    } else {
      password = req.body.password;
    }

    const securePassword = process.env.ADMIN_PASS;

    // Проверка, что ты не забыл добавить переменную в Vercel
    if (!securePassword) {
      return res.status(500).json({ message: "Ошибка: В настройках Vercel не найден ADMIN_PASS" });
    }

    // 4. СРАВНИВАЕМ
    if (password === securePassword) {
      // Успех! Сбрасываем счетчик ошибок
      userRecord.count = 0;
      return res.status(200).json({ success: true });
    } else {
      // Ошибка! Увеличиваем счетчик
      userRecord.count += 1;
      
      if (userRecord.count >= 3) {
        // Бан на 15 минут
        userRecord.lockedUntil = Date.now() + 15 * 60 * 1000;
        return res.status(429).json({ 
          success: false, 
          banned: true, 
          message: "Слишком много попыток. Ты заблокирован на 15 минут." 
        });
      }

      return res.status(401).json({ 
        success: false, 
        message: Неверный пароль! Осталось попыток: ${3 - userRecord.count} 
      });
    }
  } catch (error) {
    return res.status(400).json({ message: "Ошибка в формате данных" });
  }
}