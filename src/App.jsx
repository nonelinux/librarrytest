import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const logoUrl = "https://avatars.mds.yandex.net";

// --- СТИЛИ (ДОБАВИЛ НОВЫЕ КЛАССЫ) ---
const styles = `
  :root { --main-red: #cc2222; --bg: #0a0c10; --card: #161b22; --text: #f0f6fc; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
  
  .nav { display: flex; justify-content: space-between; align-items: center; padding: 10px 5%; background: #fff; border-bottom: 3px solid var(--main-red); position: sticky; top: 0; z-index: 1000; }
  .logo-link { display: flex; align-items: center; text-decoration: none; gap: 10px; }
  .nav-logo { height: 50px; border-radius: 5px; }
  .nav-links { display: flex; gap: 20px; align-items: center; }
  .nav-links a, .nav-links button { color: #333; text-decoration: none; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; background: none; }

  .filter-bar { display: flex; gap: 10px; justify-content: center; padding: 20px; flex-wrap: wrap; }
  .filter-btn { background: #161b22; border: 1px solid #30363d; color: #8b949e; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 13px; }
  .filter-btn.active { background: var(--main-red); color: #fff; border-color: var(--main-red); }

  .hero { text-align: center; padding: 40px 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; padding: 20px 5%; }
  .book-card { background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid #30363d; transition: 0.3s; }
  .book-img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 8px; }

  .btn { width: 100%; padding: 12px; background: var(--main-red); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; margin-top: 10px; text-align: center; text-decoration: none; display: block; }
  .box { max-width: 450px; margin: 40px auto; background: var(--card); padding: 30px; border-radius: 15px; border: 1px solid #30363d; }
  .input { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid #333; background: #000; color: #fff; outline: none; }

  .admin-row { display: flex; justify-content: space-between; align-items: center; background: #0d1117; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #30363d; }
`;

// --- ГЛАВНАЯ (СОБЫТИЯ) ---
const Home = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => onSnapshot(collection(db, "events"), (s) => setEvents(s.docs.map(d => d.data()))), []);

  return (
    <div className="container" style={{maxWidth:'900px', margin:'0 auto', padding:'20px'}}>
      <div className="hero">
        <img src={logoUrl} alt="лого" style={{height:'100px', marginBottom:'20px'}} />
        <h1 style={{fontSize:'2.5rem'}}>Новости Библиотеки 518</h1>
      </div>
      {events.map((e, i) => (
        <div key={i} className="event-card" style={{background:'var(--card)', borderRadius:'15px', overflow:'hidden', marginBottom:'30px', border:'1px solid #333'}}>
          {e.image && <img src={e.image} style={{width:'100%', height:'250px', objectFit:'cover'}} alt="" />}
          <div style={{padding:'20px'}}>
            <span style={{color: 'var(--main-red)', fontSize:'0.8rem'}}>{e.date}</span>
            <h2 style={{marginTop:'5px'}}>{e.title}</h2>
            <p style={{color:'#8b949e'}}>{e.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- [ОБНОВЛЕНО] КАТАЛОГ С ЖАНРАМИ ---
const Catalog = () => {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('Все');
  const genres = ['Все', 'Классика', 'Учебники', 'Фантастика', 'Детектив'];

  useEffect(() => onSnapshot(collection(db, "books"), (s) => setBooks(s.docs.map(d => ({ docId: d.id, ...d.data() })))), []);

  const filtered = filter === 'Все' ? books : books.filter(b => (b.genre || b.жанр) === filter);

  return (
    <>
      <div className="filter-bar">
        {genres.map(g => (
          <button key={g} className={`filter-btn ${filter === g ? 'active' : ''}`} onClick={() => setFilter(g)}>{g}</button>
        ))}
      </div>
      <div className="grid">
        {filtered.map(b => (
          <div key={b.docId} className="book-card">
            <img src={b.image || b.имидж} className="book-img" alt="" />
            <h4 style={{margin:'10px 0 5px', fontSize:'0.9rem'}}>{b.title || b.титул}</h4>
            <p style={{fontSize:'0.8rem', color:'#8b949e'}}>{b.author || b.автор}</p>
            <span style={{fontSize:'10px', color: (b.status || b.статус) === 'В наличии' ? '#2ecc71' : '#f85149'}}>{(b.status || b.статус)}</span>
            {(b.status || b.статус) === 'В наличии' ? (
              <Link to="/order" state={{t: b.title || b.титул, id: b.docId}} className="btn">ВЗЯТЬ</Link>
            ) : <div className="btn" style={{background:'#333', textAlign:'center'}}>ВЫДАНА</div>}
          </div>
        ))}
      </div>
    </>
  );
};

// --- [НОВОЕ] ЛИЧНЫЙ КАБИНЕТ ---
const Profile = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, "users", user.uid)).then(s => setUserData(s.data()));
      onSnapshot(query(collection(db, "orders"), where("userEmail", "==", user.email)), s => setOrders(s.docs.map(d => d.data())));
    }
  }, [user]);

  if (!user) return <div className="box">Войдите в аккаунт</div>;

  return (
    <div className="box">
      <h2 style={{color:'var(--main-red)'}}>Мой профиль</h2>
      <p><b>ФИО:</b> {userData?.fio}</p>
      <p><b>Класс:</b> {userData?.class}</p>
      <hr style={{borderColor:'#333'}}/>
      <h3>Мои заказы:</h3>
      {orders.map((o, i) => (
        <div key={i} className="admin-row">
          <span>{o.book}</span>
          <span style={{color:'var(--main-red)', fontSize:'12px'}}>{o.status}</span>
        </div>
      ))}
    </div>
  );
};

// --- [НОВОЕ] АДМИНКА ---
const Admin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [orders, setOrders] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: 'Классика', image: '', status: 'В наличии' });

  useEffect(() => {
    const p = prompt("Пароль администратора:");
    if (p === import.meta.env.VITE_ADMIN_PASS) setIsAuth(true);
    else window.location.href = "#/";
  }, []);

  useEffect(() => {
    if (isAuth) onSnapshot(collection(db, "orders"), s => setOrders(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [isAuth]);

  const addBook = async () => {
    await addDoc(collection(db, "books"), newBook);
    alert("Книга добавлена!");
  };

  const setStatus = async (oid, bid, st) => {
    await updateDoc(doc(db, "orders", oid), { status: st === 'В наличии' ? 'Вернули' : 'Выдана' });
    if (bid) await updateDoc(doc(db, "books", bid), { status: st });
    alert("Статус обновлен!");
  };

  if (!isAuth) return null;

  return (
    <div className="container" style={{padding:'20px'}}>
      <div className="box">
        <h3>Добавить книгу</h3>
        <input className="input" placeholder="Название" onChange={e => setNewBook({...newBook, title: e.target.value})} />
        <select className="input" onChange={e => setNewBook({...newBook, genre: e.target.value})} style={{background:'#000', color:'#fff'}}>
          <option>Классика</option><option>Учебники</option><option>Фантастика</option><option>Детектив</option>
        </select>
        <input className="input" placeholder="URL обложки" onChange={e => setNewBook({...newBook, image: e.target.value})} />
        <button className="btn" style={{background:'green'}} onClick={addBook}>ДОБАВИТЬ</button>
      </div>
      <div style={{maxWidth:'800px', margin:'0 auto'}}>
        <h2>Управление заказами</h2>
        {orders.map(o => (
          <div key={o.id} className="admin-row">
            <div><b>{o.book}</b><br/><small>{o.fio} ({o.class})</small></div>
            <div>
              <button onClick={() => setStatus(o.id, o.bookId, 'Выдана')} style={{background:'green', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px', marginRight:'5px', cursor:'pointer'}}>ВЫДАТЬ</button>
              <button onClick={() => setStatus(o.id, o.bookId, 'В наличии')} style={{background:'#3498db', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px', cursor:'pointer'}}>ВЕРНУТЬ</button>
              <button onClick={() => deleteDoc(doc(db, "orders", o.id))} style={{background:'#444', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px', marginLeft:'5px', cursor:'pointer'}}>X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ВХОД / РЕГИСТРАЦИЯ ---
const Auth = () => {
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ email: '', pass: '', fio: '', class: '' });
  const nav = useNavigate();

  const handle = async () => {
    try {
      if (isReg) {
        const res = await createUserWithEmailAndPassword(auth, form.email, form.pass);
        await setDoc(doc(db, "users", res.user.uid), { fio: form.fio, class: form.class, email: form.email });
      } else await signInWithEmailAndPassword(auth, form.email, form.pass);
      nav('/');
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="box">
      <h2 style={{textAlign:'center'}}>{isReg ? 'Регистрация' : 'Вход'}</h2>
      {isReg && <><input className="input" placeholder="ФИО" onChange={e => setForm({...form, fio: e.target.value})} /><input className="input" placeholder="Класс" onChange={e => setForm({...form, class: e.target.value})} /></>}
      <input className="input" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} />
      <input className="input" type="password" placeholder="Пароль" onChange={e => setForm({...form, pass: e.target.value})} />
      <button className="btn" onClick={handle}>{isReg ? 'ЗАРЕГИСТРИРОВАТЬСЯ' : 'ВОЙТИ'}</button>
      <p onClick={() => setIsReg(!isReg)} style={{textAlign:'center', fontSize:'13px', cursor:'pointer', marginTop:'15px', color:'#8b949e'}}>{isReg ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}</p>
    </div>
  );
};

// --- ЗАКАЗ ---
const Order = ({ user }) => {
  const { state } = useLocation();
  const nav = useNavigate();
  const confirm = async () => {
    if (!user) return nav('/auth');
    const uS = await getDoc(doc(db, "users", user.uid));
    const uD = uS.data();
    await addDoc(collection(db, "orders"), { userEmail: user.email, fio: uD.fio, class: uD.class, book: state.t, bookId: state.id, date: new Date().toLocaleDateString(), status: "Ожидает" });
    await updateDoc(doc(db, "books", state.id), { status: "Выдана" });
    alert("Забронировано!"); nav('/profile');
  };
  return <div className="box" style={{textAlign:'center'}}><h3>Взять "{state?.t}"?</h3><button className="btn" onClick={confirm}>ПОДТВЕРДИТЬ</button></div>;
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  return (
    <Router>
      <style>{styles}</style>
      <nav className="nav">
        <Link to="/" className="logo-link"><img src={logoUrl} className="nav-logo" alt="" /><span style={{color: 'var(--main-red)', fontWeight:'900'}}>LIB.518</span></Link>
        <div className="nav-links">
          <Link to="/">Главная</Link>
          <Link to="/catalog">Каталог</Link>
          {user && <Link to="/profile">Профиль</Link>}
          <a href="https://518shkola.oshkole.ru" target="_blank" rel="noreferrer">Сайт школы</a>
          <Link to="/admin" style={{fontSize: '10px', color:'var(--main-red)', border:'1px solid var(--main-red)', padding:'2px 5px', borderRadius:'4px'}}>ADM</Link>
          {user ? <button onClick={() => signOut(auth)} style={{color:'var(--main-red)'}}>Выход</button> : <Link to="/auth" style={{color:'var(--main-red)'}}>Вход</Link>}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/order" element={<Order user={user} />} />
      </Routes>
    </Router>
  );
}
