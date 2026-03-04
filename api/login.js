// --- [АДМИНКА] ---
  useEffect(() => {
    const checkPassword = async () => {
      const p = prompt("Пароль:");
      
      if (!p) {
        window.location.href = "#/";
        return;
      }

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: p })
        });

        const data = await response.json();

        if (data.success) {
          setIsAuth(true);
        } else {
          // Выводим сообщение от сервера (про бан или оставшиеся попытки)
          alert(data.message);
          
          // Если сервер вернул флаг бана, можно вообще перекинуть на страшную страницу
          if (data.banned) {
             document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:50px;'>ХАКЕР ЗАБАНЕН! IP В ЧЕРНОМ СПИСКЕ</h1>";
          } else {
             window.location.href = "#/";
          }
        }
      } catch (error) {
        console.error("Ошибка сервера:", error);
        window.location.href = "#/";
      }
    };

    checkPassword();
  }, []);