import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGyw8mIxEGI-iVveToUEzBH8IQLRQK_oQ",
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

// --- СТИЛИ ---
const styles = `
  :root { --main-red: #cc2222; --bg: #0a0c10; --card: #161b22; --text: #f0f6fc; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
  
  .nav { display: flex; justify-content: space-between; align-items: center; padding: 10px 5%; background: #fff; border-bottom: 3px solid var(--main-red); position: sticky; top: 0; z-index: 1000; }
  .logo-link { display: flex; align-items: center; text-decoration: none; gap: 10px; }
  .nav-logo { height: 50px; border-radius: 5px; }
  .nav-links { display: flex; gap: 20px; align-items: center; }
  .nav-links a, .nav-links button { color: #333; text-decoration: none; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; background: none; }

  .hero { text-align: center; padding: 40px 20px; }
  .event-card { background: var(--card); border-radius: 15px; overflow: hidden; margin-bottom: 30px; border: 1px solid #30363d; display: flex; flex-direction: column; }
  .event-img { width: 100%; height: 250px; object-fit: cover; }
  .event-content { padding: 20px; text-align: left; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; padding: 20px 5%; }
  .book-card { background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid #30363d; transition: 0.3s; }
  .book-card:hover { border-color: var(--main-red); }
  .book-img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 8px; }

  .btn { width: 100%; padding: 12px; background: var(--main-red); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; margin-top: 10px; }
  .box { max-width: 450px; margin: 40px auto; background: var(--card); padding: 30px; border-radius: 15px; border: 1px solid #30363d; }
  .input { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid #333; background: #000; color: #fff; }
`;

// --- ГЛАВНАЯ (СОБЫТИЯ) ---
const Home = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    return onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map(d => d.data()));
    });
  }, []);

  return (
    <div className="container" style={{maxWidth:'900px', margin:'0 auto', padding:'20px'}}>
      <div className="hero">
        <img src={logoUrl} alt="лого" style={{height:'100px', marginBottom:'20px'}} />
        <h1 style={{fontSize:'2.5rem'}}>Новости Библиотеки 518</h1>
      </div>
      {events.map((e, i) => (
        <div key={i} className="event-card">
          {e.image && <img src={e.image} className="event-img" alt="event" />}
          <div className="event-content">
            <span style={{color: 'var(--main-red)', fontSize:'0.8rem'}}>{e.date}</span>
            <h2 style={{marginTop:'5px'}}>{e.title}</h2>
            <p style={{color:'#8b949e'}}>{e.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- КАТАЛОГ ---
const Catalog = () => {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    return onSnapshot(collection(db, "books"), (snap) => {
      setBooks(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div className="grid">
      {books.map(b => (
        <div key={b.docId} className="book-card">
          <img src={b.image || b.имидж} className="book-img" alt="" />
          <h4 style={{margin:'10px 0 5px', fontSize:'0.9rem'}}>{b.title || b.титул}</h4>
          <p style={{fontSize:'0.8rem', color:'#8b949e'}}>{b.author || b.автор}</p>
          <span style={{fontSize:'10px', color: (b.status || b.статус) === 'В наличии' ? '#2ecc71' : '#f85149'}}>
            {(b.status || b.статус)}
          </span>
          {(b.status || b.статус) === 'В наличии' ? (
            <Link to="/order" state={{t: b.title || b.титул, id: b.docId}} className="btn" style={{textDecoration:'none', textAlign:'center', display:'block'}}>ВЗЯТЬ</Link>
          ) : <div className="btn" style={{background:'#333', textAlign:'center'}}>ВЫДАНА</div>}
        </div>
      ))}
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
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.pass);
      }
      nav('/');
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="box">
      <h2 style={{textAlign:'center'}}>{isReg ? 'Регистрация читателя' : 'Вход'}</h2>
      {isReg && (
        <>
          <input className="input" placeholder="ФИО полностью" onChange={e => setForm({...form, fio: e.target.value})} />
          <input className="input" placeholder="Класс (например, 9А)" onChange={e => setForm({...form, class: e.target.value})} />
        </>
      )}
      <input className="input" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} />
      <input className="input" type="password" placeholder="Пароль" onChange={e => setForm({...form, pass: e.target.value})} />
      <button className="btn" onClick={handle}>{isReg ? 'ЗАРЕГИСТРИРОВАТЬСЯ' : 'ВОЙТИ'}</button>
      <p onClick={() => setIsReg(!isReg)} style={{textAlign:'center', fontSize:'13px', cursor:'pointer', marginTop:'15px', color:'#8b949e'}}>
        {isReg ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
      </p>
    </div>
  );
};

// --- ЗАКАЗ ---
const Order = ({ user }) => {
  const { state } = useLocation();
  const nav = useNavigate();

  const confirm = async () => {
    if (!user) return nav('/auth');
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userSnap.data();

    await addDoc(collection(db, "orders"), {
      userEmail: user.email,
      fio: userData.fio,
      class: userData.class,
      book: state.t,
      date: new Date().toLocaleDateString(),
      status: "Ожидает"
    });
    await updateDoc(doc(db, "books", state.id), { status: "Выдана" });
    alert("Книга забронирована на имя: " + userData.fio);
    nav('/');
  };

  return (
    <div className="box" style={{textAlign:'center'}}>
      <h3>Подтверждение заказа</h3>
      <p>Книга: <b>{state?.t}</b></p>
      <button className="btn" onClick={confirm}>ПОДТВЕРДИТЬ</button>
    </div>
  );
};

// --- MAIN ---
export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  return (
    <Router>
      <style>{styles}</style>
      <nav className="nav">
        <Link to="/" className="logo-link">
          <img src={logoUrl} className="nav-logo" alt="" />
          <span style={{color: 'var(--main-red)', fontWeight:'900'}}>LIB.518</span>
        </Link>
        <div className="nav-links">
          <Link to="/">Главная</Link>
          <Link to="/catalog">Каталог</Link>
          <a href="https://518shkola.oshkole.ru" target="_blank">Сайт школы</a>
          {user ? (
            <button onClick={() => signOut(auth)} style={{color:'var(--main-red)'}}>Выход</button>
          ) : <Link to="/auth" style={{color:'var(--main-red)'}}>Вход</Link>}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/order" element={<Order user={user} />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  );
}
