import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, getDoc, setDoc, deleteDoc, orderBy, limit, getDocs } from "firebase/firestore";

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

const logoUrl = "https://avatars.mds.yandex.net";

const styles = `
  :root { --main-red: #cc2222; --bg: #0a0c10; --card: #161b22; --text: #f0f6fc; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
  .nav { display: flex; justify-content: space-between; align-items: center; padding: 10px 5%; background: #fff; border-bottom: 3px solid var(--main-red); position: sticky; top: 0; z-index: 1000; }
  .logo-link { display: flex; align-items: center; text-decoration: none; gap: 10px; color: var(--main-red); font-weight: 900; }
  .nav-logo { height: 45px; }
  .nav-links { display: flex; gap: 15px; align-items: center; }
  .nav-links a, .nav-links button { color: #333; text-decoration: none; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; background: none; }
  .filter-bar { display: flex; gap: 10px; justify-content: center; padding: 20px; flex-wrap: wrap; }
  .filter-btn { background: #161b22; border: 1px solid #30363d; color: #8b949e; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 11px; text-transform: capitalize; transition: 0.2s; }
  .filter-btn.active { background: var(--main-red); color: #fff; border-color: var(--main-red); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 20px; padding: 0 5% 40px; }
  .book-card { background: var(--card); padding: 12px; border-radius: 12px; border: 1px solid #30363d; transition: 0.3s; }
  .book-img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 8px; }
  .btn { width: 100%; padding: 10px; background: var(--main-red); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; margin-top: 10px; text-decoration: none; display: block; text-align: center; }
  .box { max-width: 450px; margin: 30px auto; background: var(--card); padding: 25px; border-radius: 15px; border: 1px solid #30363d; }
  .input { width: 100%; padding: 10px; margin: 6px 0; border-radius: 8px; border: 1px solid #333; background: #000; color: #fff; outline: none; }
  .admin-row { background: #0d1117; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #333; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; }
`;

// --- [КАТАЛОГ] ---
const Catalog = () => {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('Все');

  useEffect(() => onSnapshot(collection(db, "books"), (s) => setBooks(s.docs.map(d => ({ docId: d.id, ...d.data() })))), []);

  const dynamicGenres = useMemo(() => {
    const allGenres = books.map(b => (b.genre || b.жанр || 'Без жанра'));
    return ['Все', ...new Set(allGenres)];
  }, [books]);

  const filtered = filter === 'Все' ? books : books.filter(b => (b.genre || b.жанр || 'Без жанра') === filter);

  return (
    <>
      <div className="filter-bar">
        {dynamicGenres.map(g => <button key={g} className={`filter-btn ${filter === g ? 'active' : ''}`} onClick={() => setFilter(g)}>{g}</button>)}
      </div>
      <div className="grid">
        {filtered.map(b => (
          <div key={b.docId} className="book-card">
            <img src={b.image || b.имидж} className="book-img" alt="" />
            <h4 style={{margin: '10px 0 5px', fontSize: '0.85rem'}}>{b.title || b.титул}</h4>
            <p style={{fontSize: '0.75rem', color: '#8b949e', margin: '0 0 10px'}}>Автор: {b.author || b.автор || 'Не указан'}</p>
            <div style={{fontSize: '10px', fontWeight: 'bold', color: (b.status || b.статус) === 'В наличии' ? '#2ecc71' : '#f85149'}}>{(b.status || b.статус)}</div>
            {(b.status || b.статус) === 'В наличии' ? <Link to="/order" state={{t: b.title || b.титул, id: b.docId}} className="btn">ВЗЯТЬ</Link> : <div className="btn" style={{background: '#333'}}>ВЫДАНА</div>}
          </div>
        ))}
      </div>
    </>
  );
};

// --- [АДМИНКА] ---
const Admin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [orders, setOrders] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: '', image: '', status: 'В наличии' });

  useEffect(() => {
    const p = prompt("Пароль:");
    if (p === import.meta.env.VITE_ADMIN_PASS) setIsAuth(true);
    else window.location.href = "#/";
  }, []);

  useEffect(() => { if (isAuth) onSnapshot(collection(db, "orders"), s => setOrders(s.docs.map(d => ({id: d.id, ...d.data()})))); }, [isAuth]);

  // АВТО-ID: Ищем самую большую цифру ID в базе и прибавляем 1
  const addBook = async () => {
    const q = query(collection(db, "books"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(q);
    let nextId = 1;
    if (!snap.empty) {
      nextId = Number(snap.docs[0].data().id) + 1;
    }

    await addDoc(collection(db, "books"), { ...newBook, id: nextId });
    alert(`Книга добавлена! Присвоен ID: ${nextId}`);
    setNewBook({ title: '', author: '', genre: '', image: '', status: 'В наличии' });
  };

  const setStatus = async (oid, bid, st) => {
    await updateDoc(doc(db, "orders", oid), { status: st === 'В наличии' ? 'Вернули' : 'Выдана' });
    if (bid) await updateDoc(doc(db, "books", bid), { status: st });
  };

  if (!isAuth) return null;

  return (
    <div className="box" style={{maxWidth: '800px'}}>
      <h2 style={{color: 'var(--main-red)', textAlign: 'center'}}>Панель Учителя</h2>
      <div className="box" style={{background: '#000', margin: '20px 0'}}>
         <h4>Добавить новую книгу</h4>
         <input className="input" placeholder="Название книги" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
         <input className="input" placeholder="Автор книги" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
         <input className="input" placeholder="Жанр" value={newBook.genre} onChange={e => setNewBook({...newBook, genre: e.target.value})} />
         <input className="input" placeholder="URL обложки" value={newBook.image} onChange={e => setNewBook({...newBook, image: e.target.value})} />
         <p style={{fontSize:'11px', color:'#555'}}>ID присоится автоматически (+1 к последнему)</p>
         <button className="btn" style={{background: 'green'}} onClick={addBook}>СОХРАНИТЬ</button>
      </div>
      <h3 style={{marginTop:'30px'}}>Заказы</h3>
      {orders.map(o => (
        <div key={o.id} className="admin-row">
          <div><b>{o.book}</b><br/><small>{o.fio} {o.class}</small></div>
          <div>
            <button style={{background:'green', color:'#fff', padding:'5px', borderRadius:'4px', cursor:'pointer'}} onClick={() => setStatus(o.id, o.bookId, 'Выдана')}>ВЫДАТЬ</button>
            <button style={{background:'#3498db', color:'#fff', padding:'5px', borderRadius:'4px', marginLeft:'5px'}} onClick={() => setStatus(o.id, o.bookId, 'В наличии')}>ВЕРНУТЬ</button>
            <button style={{background:'#444', color:'#fff', padding:'5px', borderRadius:'4px', marginLeft:'5px'}} onClick={() => deleteDoc(doc(db, "orders", o.id))}>X</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- [ОСТАЛЬНОЕ] ---
const Home = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => onSnapshot(collection(db, "events"), (s) => setEvents(s.docs.map(d => d.data()))), []);
  return (
    <div style={{maxWidth: '850px', margin: '0 auto', padding: '20px', textAlign: 'center'}}>
      <img src={logoUrl} alt="logo" style={{height: '90px'}} />
      <h1>Библиотека Школы 518</h1>
      {events.map((e, i) => (
        <div key={i} className="box" style={{maxWidth: '100%', textAlign: 'left'}}>
          {e.image && <img src={e.image} style={{width: '100%', borderRadius: '10px', marginBottom: '15px'}} alt="" />}
          <h3>{e.title}</h3>
          <p style={{color: '#8b949e'}}>{e.description}</p>
          <span style={{fontSize: '11px', color: 'var(--main-red)'}}>{e.date}</span>
        </div>
      ))}
    </div>
  );
};

const Profile = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    if (user) {
      getDoc(doc(db, "users", user.uid)).then(s => setUserData(s.data()));
      onSnapshot(query(collection(db, "orders"), where("userEmail", "==", user.email)), s => setOrders(s.docs.map(d => d.data())));
    }
  }, [user]);
  if (!user) return <div className="box">Войдите в кабинет</div>;
  return (
    <div className="box">
      <h2>Мой профиль</h2>
      <div style={{background: '#0d1117', padding: '15px', borderLeft: '4px solid var(--main-red)', borderRadius: '8px'}}>
        <p><b>ФИО:</b> {userData?.fio}</p>
        <p><b>Класс:</b> {userData?.class}</p>
        <p><b>Email:</b> {user.email}</p>
      </div>
      <h3 style={{marginTop: '20px'}}>Мои книги:</h3>
      {orders.map((o, i) => <div key={i} className="admin-row"><span>{o.book}</span><span style={{color:'var(--main-red)', fontWeight:'bold'}}>{o.status}</span></div>)}
    </div>
  );
};

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
      <h2>{isReg ? 'Регистрация' : 'Вход'}</h2>
      {isReg && <><input className="input" placeholder="ФИО" onChange={e => setForm({...form, fio: e.target.value})}/><input className="input" placeholder="Класс" onChange={e => setForm({...form, class: e.target.value})}/></>}
      <input className="input" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})}/>
      <input className="input" type="password" placeholder="Пароль" onChange={e => setForm({...form, pass: e.target.value})}/>
      <button className="btn" onClick={handle}>{isReg ? 'ОК' : 'ВОЙТИ'}</button>
      <p style={{textAlign: 'center', cursor:'pointer', fontSize:'0.8rem'}} onClick={() => setIsReg(!isReg)}>{isReg ? 'Уже есть аккаунт' : 'Создать аккаунт'}</p>
    </div>
  );
};

const Order = ({ user }) => {
  const { state } = useLocation();
  const nav = useNavigate();
  const confirm = async () => {
    if (!user) return nav('/auth');
    const uSnap = await getDoc(doc(db, "users", user.uid));
    const uData = uSnap.data();
    await addDoc(collection(db, "orders"), { userEmail: user.email, fio: uData.fio, class: uData.class, book: state.t, bookId: state.id, date: new Date().toLocaleDateString(), status: "Ожидает" });
    await updateDoc(doc(db, "books", state.id), { status: "Выдана" });
    alert("Забронировано!"); nav('/profile');
  };
  return <div className="box" style={{textAlign:'center'}}><h3>Взять "{state?.t}"?</h3><button className="btn" onClick={confirm}>ДА</button></div>;
};

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);
  return (
    <Router>
      <style>{styles}</style>
      <nav className="nav">
        <Link to="/" className="logo-link"><img src={logoUrl} className="nav-logo" alt="" />LIB.518</Link>
        <div className="nav-links">
          <Link to="/">Главная</Link>
          <Link to="/catalog">Каталог</Link>
          {user && <Link to="/profile">Кабинет</Link>}
          <a href="https://518shkola.oshkole.ru" target="_blank" rel="noreferrer">Сайт</a>
          <Link to="/admin" style={{fontSize: '10px', color: 'var(--main-red)', border: '1px solid var(--main-red)', padding: '2px 5px', borderRadius: '4px'}}>ADM</Link>
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
