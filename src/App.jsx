import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, onSnapshot, orderBy, limit, getDocs } from "firebase/firestore";

// --- КОНФИГУРАЦИЯ ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "loginsofflibrarry.firebaseapp.com",
  projectId: "loginsofflibrarry",
  storageBucket: "loginsofflibrarry.firebasestorage.app",
  messagingSenderId: "24575544080",
  appId: "1:24575544080:web:1d338de5b963ce2726f395"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- СТИЛИ (Адаптация + Админка) ---
const styles = `
  :root { --red: #cc2222; --bg: #0a0c10; --card: #161b22; --text: #f0f6fc; --green: #2ea043; }
  *, *:before, *:after { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow-x: hidden; }
  
  .nav { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #fff; border-bottom: 3px solid var(--red); position: sticky; top: 0; z-index: 1000; }
  .logo { text-decoration: none; color: var(--red); font-weight: 900; font-size: 1.2rem; }
  .nav-links { display: flex; gap: 15px; align-items: center; }
  .nav-links a, .nav-links button { color: #333; text-decoration: none; font-size: 0.8rem; font-weight: 700; border: none; background: none; cursor: pointer; }

  .admin-container { width: 95%; max-width: 900px; margin: 20px auto; }
  .admin-card { background: var(--card); padding: 25px; border-radius: 15px; border: 1px solid #30363d; margin-bottom: 25px; }
  .input { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid #333; background: #000; color: #fff; font-size: 16px; outline: none; }
  .btn { width: 100%; padding: 12px; background: var(--red); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; text-align: center; font-size: 0.85rem; transition: 0.3s; }
  .btn:hover { opacity: 0.8; }
  
  .admin-row { background: #0d1117; padding: 15px; border-radius: 12px; margin-bottom: 12px; border: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
  .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
  .badge.yellow { background: #d2992233; color: #d29922; border: 1px solid #d2992266; }
  .badge.green { background: #2ea04333; color: #2ea043; border: 1px solid #2ea04366; }

  @media (max-width: 600px) {
    .admin-row { flex-direction: column; align-items: flex-start; gap: 12px; }
    .admin-row-btns { width: 100%; display: flex; gap: 8px; }
  }
`;

// --- КОМПОНЕНТ АДМИНКИ ---
const Admin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [orders, setOrders] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: '', image: '', count: 1 });

  useEffect(() => {
    let isMounted = true;
    const runAuth = async () => {
      // Предотвращаем двойной prompt в React Strict Mode
      if (window.isAdminLoginActive) return;
      window.isAdminLoginActive = true;

      const p = prompt("Пароль администратора:");
      if (!p) {
        window.location.href = "#/";
        window.isAdminLoginActive = false;
        return;
      }

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: p })
        });
        
        const data = await res.json();
        
        if (data.success && isMounted) {
          setIsAuth(true);
        } else {
          alert(data.message);
          // Если пришел бан (код 429), можем жестко заблокировать экран
          if (res.status === 429) {
            document.body.innerHTML = <div style="background:#000;color:red;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;font-family:sans-serif;"><h1>БЕЗОПАСНОСТЬ 518:<br/>IP ЗАБЛОКИРОВАН</h1></div>;
          } else {
            window.location.href = "#/";
          }
        }
      } catch (e) {
        alert("Ошибка связи с API");
        window.location.href = "#/";
      } finally {
        window.isAdminLoginActive = false;
      }
    };

    runAuth();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isAuth) {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      return onSnapshot(q, s => {
        setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [isAuth]);

  const addBook = async () => {
    if (!newBook.title) return alert("Введите название!");
    const q = query(collection(db, "books"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(q);
    const nextId = snap.empty ? 1 : Number(snap.docs[0].data().id) + 1;

    await addDoc(collection(db, "books"), {
      ...newBook,
      id: nextId,
      count: Number(newBook.count),
      status: 'В наличии',
      createdAt: Date.now()
    });
    alert(`Книга "${newBook.title}" добавлена!`);
    setNewBook({ title: '', author: '', genre: '', image: '', count: 1 });
  };

  const updateOrder = async (oid, bid, status, currentCount) => {
    await updateDoc(doc(db, "orders", oid), { status });
    if (bid) {
      if (status === 'В наличии (возврат)') {
        await updateDoc(doc(db, "books", bid), { status: 'В наличии', count: Number(currentCount) + 1 });
      } else {
        await updateDoc(doc(db, "books", bid), { status });
      }
    }
  };

  if (!isAuth) return <div style={{background:'#0a0c10', height:'100vh'}} />;

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h2 style={{marginTop: 0, color: 'var(--red)'}}>➕ Добавить книгу</h2>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <input className="input" placeholder="Название" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
          <input className="input" placeholder="Автор" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
          <input className="input" placeholder="Жанр" value={newBook.genre} onChange={e => setNewBook({...newBook, genre: e.target.value})} />
          <input className="input" type="number" placeholder="Кол-во" value={newBook.count} onChange={e => setNewBook({...newBook, count: e.target.value})} />
        </div>
        <input className="input" placeholder="Ссылка на обложку" value={newBook.image} onChange={e => setNewBook({...newBook, image: e.target.value})} />
        <button className="btn" style={{background: 'var(--green)', marginTop: '10px'}} onClick={addBook}>СОХРАНИТЬ В БАЗУ</button>
      </div>

      <h3>📚 Управление заказами</h3>
      {orders.length === 0 ? <p style={{color:'#8b949e'}}>Заказов пока нет...</p> : 
        orders.map(o => (
          <div key={o.id} className="admin-row">
            <div>
              <b style={{fontSize: '1.1rem'}}>{o.book}</b><br/>
              <small style={{color: '#8b949e'}}>{o.fio} • {o.class} класс</small>
              <div style={{marginTop: '8px'}}>
                <span className={`badge ${o.status === 'Выдана' ? 'green' : 'yellow'}`}>
                  {o.status || 'Заказана'}
                </span>
              </div>
            </div>
            <div className="admin-row-btns">
              {(o.status === 'Заказана' || !o.status) && (
                <button onClick={() => updateOrder(o.id, o.bookId, 'Выдана', o.bookCount)} className="btn" style={{padding: '8px 20px', width: 'auto', background: 'var(--green)'}}>ВЫДАТЬ</button>
              )}
              {o.status === 'Выдана' && (
                <button onClick={() => updateOrder(o.id, o.bookId, 'В наличии (возврат)', o.bookCount)} className="btn" style={{padding: '8px 20px', width: 'auto', background: '#3498db'}}>ВЕРНУТЬ</button>
              )}
            </div>
          </div>
        ))
      }
    </div>
  );
};

// --- ГЛАВНЫЙ APP ---
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
    // Твоя ловушка
    const trap = setInterval(() => { debugger; }, 1000);
    return () => clearInterval(trap);
  }, []);

  return (
    <Router>
      <style>{styles}</style>
      <nav className="nav">
        <Link to="/" className="logo">LIB.518</Link>
        <div className="nav-links">
          <Link to="/">Главная</Link>
          <Link to="/catalog">Книги</Link>
          <Link to="/admin" style={{color: 'var(--red)'}}>АДМИН</Link>
          {user ? <button onClick={() => signOut(auth)}>Выход</button> : <Link to="/auth">Вход</Link>}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<div style={{padding:'50px', textAlign:'center'}}><h1>Библиотека школы 518</h1><p>Используйте меню для навигации.</p></div>} />
        <Route path="/admin" element={<Admin />} />
        {/* Добавь свои роуты Auth, Catalog и т.д. сюда */}
      </Routes>
    </Router>
  );
}