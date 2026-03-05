// api/login.js
// Временное хранилище в памяти сервера для отслеживания попыток
const failedAttempts = {}; 

export default async function handler(req, res) {
  // 1. Принимаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Метод не разрешен' });
  }

  // 2. Вычисляем IP-адрес (Vercel передает его в заголовках)
  const ip = req.headers['x-forwarded-for']  req.socket.remoteAddress  'unknown_ip';

  // Создаем профиль для нового IP, если его еще нет
  if (!failedAttempts[ip]) {
    failedAttempts[ip] = { count: 0, lockedUntil: 0 };
  }

  const currentTime = Date.now();

  // 3. ПРОВЕРКА НА БАН: Если IP в бане, сразу блокируем доступ
  if (currentTime < failedAttempts[ip].lockedUntil) {
    const timeLeft = Math.ceil((failedAttempts[ip].lockedUntil - currentTime) / 1000 / 60);
    return res.status(429).json({ 
      success: false, 
      banned: true, 
      message: Система защиты 518: Ваш IP заблокирован. Попробуйте через ${timeLeft} минут. 
    });
  }

  try {
    // 4. Достаем пароль из запроса
    let password;
    if (typeof req.body === 'string') {
      try {
        password = JSON.parse(req.body).password;
      } catch (e) {
        password = req.body;
      }
    } else {
      password = req.body?.password;
    }

    // Твой настоящий пароль из настроек Vercel (В КОДЕ ЕГО НЕТ!)
    const securePassword = process.env.VITE_ADMIN_PASS;

    // 5. ЛОГИКА АВТОРИЗАЦИИ
    if (password && password === securePassword) {
      // Пароль верный -> сбрасываем ошибки и пускаем
      failedAttempts[ip].count = 0;
      return res.status(200).json({ success: true, message: "Доступ разрешен" });
      
    } else {
      // Пароль неверный -> увеличиваем счетчик ошибок
      failedAttempts[ip].count += 1;
      
      // Если накопилось 3 ошибки -> БАН на 15 минут
      if (failedAttempts[ip].count >= 3) {
        failedAttempts[ip].lockedUntil = currentTime + 15 * 60 * 1000; 
        return res.status(429).json({ 
          success: false, 
          banned: true, 
          message: "Превышен лимит попыток. Ваш IP отправлен в бан-лист на 15 минут." 
        });
      }
      
      // Даем еще шанс
      const attemptsLeft = 3 - failedAttempts[ip].count;
      return res.status(401).json({ 
        success: false, 
        message: Неверный пароль. Осталось попыток: ${attemptsLeft} 
      });
    }
    
  } catch (error) {
    console.error("Ошибка сервера:", error);
    return res.status(500).json({ success: false, message: "Ошибка обработки данных" });
  }
}