import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, getDoc, setDoc, deleteDoc } from "firebase/firestore";

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

// --- AUTH (ВХОД / РЕГ С ВЕРИФИКАЦИЕЙ) ---
const Auth = () => {
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ email: '', pass: '', fio: '', class: '' });
  const nav = useNavigate();

  const handle = async () => {
    try {
      if (isReg) {
        const res = await createUserWithEmailAndPassword(auth, form.email, form.pass);
        await setDoc(doc(db, "users", res.user.uid), { fio: form.fio, class: form.class, email: form.email });
        await sendEmailVerification(res.user);
        alert("Письмо для подтверждения отправлено на почту!");
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.pass);
      }
      nav('/');
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="box" style={{maxWidth:'400px', margin:'50px auto', background:'#161b22', padding:'30px', borderRadius:'15px'}}>
      <h2 style={{textAlign:'center'}}>{isReg ? 'Регистрация' : 'Вход'}</h2>
      {isReg && <><input className="input" placeholder="ФИО" onChange={e => setForm({...form, fio: e.target.value})}/><input className="input" placeholder="Класс" onChange={e => setForm({...form, class: e.target.value})}/></>}
      <input className="input" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})}/>
      <input className="input" type="password" placeholder="Пароль" onChange={e => setForm({...form, pass: e.target.value})}/>
      <button className="btn" style={{background:'#cc2222', color:'#fff', width:'100%', padding:'10px', marginTop:'10px'}} onClick={handle}>{isReg ? 'ОК' : 'ВОЙТИ'}</button>
      <p style={{textAlign:'center', cursor:'pointer', fontSize:'0.8rem', marginTop:'15px'}} onClick={() => setIsReg(!isReg)}>{isReg ? 'Уже есть аккаунт' : 'Создать аккаунт'}</p>
    </div>
  );
};

// --- ЗАКАЗ (ПРОВЕРКА ВЕРИФИКАЦИИ) ---
const Order = ({ user }) => {
  const { state } = useLocation();
  const nav = useNavigate();

  const confirm = async () => {
    if (!user) return nav('/auth');
    if (!user.emailVerified) return alert("Подтвердите почту перед заказом!");
    
    const uSnap = await getDoc(doc(db, "users", user.uid));
    const uData = uSnap.data();
    await addDoc(collection(db, "orders"), { userEmail: user.email, fio: uData.fio, class: uData.class, book: state.t, bookId: state.id, date: new Date().toLocaleDateString(), status: "Ожидает" });
    await updateDoc(doc(db, "books", state.id), { status: "Выдана" });
    alert("Забронировано!"); nav('/');
  };

  return <div className="box" style={{textAlign:'center', marginTop:'100px'}}><h3>Взять "{state?.t}"?</h3><button className="btn" style={{background:'#cc2222', color:'#fff', padding:'10px 40px'}} onClick={confirm}>ДА</button></div>;
};

// --- АДМИНКА (ФИКС КНОПОК) ---
const Admin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [orders, setOrders] = useState([]);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const p = prompt("Пароль:");
    if (p === import.meta.env.VITE_ADMIN_PASS) setIsAuth(true);
    else window.location.href = "#/";
  }, []);

  useEffect(() => {
    if (isAuth) {
      onSnapshot(collection(db, "orders"), s => setOrders(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "books"), s => setBooks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [isAuth]);

  const setStatus = async (oid, bid, st) => {
    if (oid) await updateDoc(doc(db, "orders", oid), { status: st === 'В наличии' ? 'Вернули' : 'Выдана' });
    if (bid) await updateDoc(doc(db, "books", bid), { status: st });
    alert("Статус обновлен!");
  };

  if (!isAuth) return null;

  return (
    <div style={{padding:'20px 5%', color:'#fff'}}>
      <h2>Заказы</h2>
      {orders.map(o => (
        <div key={o.id} style={{background:'#161b22', padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
          <span>{o.book} ({o.fio})</span>
          <div>
            <button onClick={() => setStatus(o.id, o.bookId, 'Выдана')}>ВЫДАТЬ</button>
            <button onClick={() => setStatus(o.id, o.bookId, 'В наличии')}>ВЕРНУТЬ</button>
            <button onClick={() => deleteDoc(doc(db, "orders", o.id))} style={{background:'red'}}>X</button>
          </div>
        </div>
      ))}
      <hr/>
      <h2>Все книги (Ручной сброс)</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px'}}>
        {books.map(b => (
          <div key={b.id} style={{background:'#161b22', padding:'10px', border:'1px solid #333'}}>
            <div>{b.title}</div>
            <button style={{width:'100%', marginTop:'5px'}} onClick={() => updateDoc(doc(db, "books", b.id), {status:'В наличии'})}>СБРОСИТЬ СТАТУС</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ... (Тут Catalog и Home из прошлых сообщений)

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  return (
    <Router>
      <nav style={{display:'flex', justifyContent:'space-between', padding:'10px 5%', background:'#fff', borderBottom:'3px solid #cc2222'}}>
        <Link to="/" style={{color:'#cc2222', fontWeight:'bold', textDecoration:'none'}}>LIB.518</Link>
        <div>
          <Link to="/" style={{marginRight:'15px', textDecoration:'none', color:'#333'}}>Каталог</Link>
          <Link to="/admin" style={{fontSize:'10px', opacity:0.3}}>Admin</Link>
          {user ? <button onClick={() => signOut(auth)}>Выход</button> : <Link to="/auth">Вход</Link>}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/order" element={<Order user={user} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
