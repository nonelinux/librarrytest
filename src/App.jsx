import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// --- ВСТАВЬ СЮДА СВОИ ДАННЫЕ ИЗ FIREBASE CONSOLE ---
const firebaseConfig = {
  apiKey: "AIzaSyAGyw8mIxEGI-iVveToUEzBH8IQLRQK_oQ",
  authDomain: "loginsofflibrarry.firebaseapp.com",
  projectId: "loginsofflibrarry",
  storageBucket: "Тloginsofflibrarry.firebasestorage.app",
  messagingSenderId: "24575544080",
  appId: "1:24575544080:web:1d338de5b963ce2726f395"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- СТИЛИ (CSS-in-JS) ---
const styles = {
  nav: { background: '#1a1a1a', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', fontFamily: 'sans-serif' },
  logo: { color: '#646cff', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' },
  navLinks: { display: 'flex', gap: '20px', alignItems: 'center' },
  link: { color: '#fff', textDecoration: 'none', fontSize: '1rem', transition: '0.3s' },
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif', color: '#fff' },
  card: { background: '#242424', padding: '30px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center', maxWidth: '400px', margin: '0 auto' },
  input: { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px', background: '#646cff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
  btnOut: { background: 'transparent', border: '1px solid #ff4757', color: '#ff4757', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }
};

// --- КОМПОНЕНТ: НАВИГАЦИЯ ---
const Navbar = ({ user }) => (
  <nav style={styles.nav}>
    <Link to="/" style={styles.logo}>🏫 Школа-Либ</Link>
    <div style={styles.navLinks}>
      <Link to="/" style={styles.link}>Книги</Link>
      <Link to="/order" style={styles.link}>Заказать</Link>
      {user ? (
        <div style={{color: '#aaa', fontSize: '0.9rem'}}>
          {user.email} <button onClick={() => signOut(auth)} style={styles.btnOut}>Выйти</button>
        </div>
      ) : (
        <Link to="/auth" style={{...styles.link, background: '#646cff', padding: '8px 15px', borderRadius: '6px'}}>Войти</Link>
      )}
    </div>
  </nav>
);

// --- СТРАНИЦА: ВХОД / РЕГИСТРАЦИЯ ---
const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    try {
      if (isRegister) { await createUserWithEmailAndPassword(auth, email, password); alert("Успех!"); }
      else { await signInWithEmailAndPassword(auth, email, password); }
      navigate('/');
    } catch (e) { alert("Ошибка: " + e.message); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{isRegister ? 'Создать аккаунт' : 'Вход'}</h2>
        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={styles.input} />
        <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} style={styles.input} />
        <button onClick={handleAuth} style={styles.btn}>{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
        <p onClick={() => setIsRegister(!isRegister)} style={{color: '#646cff', cursor: 'pointer', marginTop: '20px', fontSize: '0.9rem'}}>
          {isRegister ? 'Уже есть аккаунт? Войдите' : 'Нет аккаунта? Регистрация'}
        </p>
      </div>
    </div>
  );
};

// --- СТРАНИЦА: КАТАЛОГ ---
const HomePage = () => (
  <div style={styles.container}>
    <h1>📚 Библиотека книг</h1>
    <p style={{color: '#aaa'}}>Добро пожаловать! Выберите книгу для заказа.</p>
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '30px'}}>
      {['Гарри Поттер', '1984', 'Мастер и Маргарита'].map(book => (
        <div key={book} style={{...styles.card, maxWidth: 'none', textAlign: 'left'}}>
          <h3>{book}</h3>
          <Link to="/order" state={{ title: book }} style={{color: '#646cff', textDecoration: 'none'}}>Забронировать →</Link>
        </div>
      ))}
    </div>
  </div>
);

// --- СТРАНИЦА: ЗАКАЗ ---
const OrderPage = ({ user }) => {
  const location = useLocation();
  const bookTitle = location.state?.title || "";
  const [book, setBook] = useState(bookTitle);

  if (!user) return <div style={styles.container}><h2>⚠️ Сначала нужно <Link to="/auth" style={{color:'#646cff'}}>войти</Link></h2></div>;

  return (
    <div style={styles.container}>
      <div style={{...styles.card, margin: '0'}}>
        <h2>Оформить заказ</h2>
        <p>Пользователь: <b>{user.email}</b></p>
        <input value={book} placeholder="Название книги" onChange={e => setBook(e.target.value)} style={styles.input} />
        <button onClick={() => alert('Заказ на "' + book + '" отправлен!')} style={{...styles.btn, background: '#2ecc71'}}>Подтвердить</button>
      </div>
    </div>
  );
};

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  if (loading) return <div style={{color: '#fff', textAlign: 'center', marginTop: '50px'}}>Загрузка...</div>;

  return (
    <Router>
      <div style={{minHeight: '100vh', background: '#1a1a1a'}}>
        <Navbar user={user} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/order" element={<OrderPage user={user} />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </div>
    </Router>
  );
}

