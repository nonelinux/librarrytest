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

const logoUrl = "data:image/jpeg;base64,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";

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

  useEffect(() => {
    onSnapshot(collection(db, "books"), (s) => setBooks(s.docs.map(d => ({ docId: d.id, ...d.data() }))));
  }, []);

  const dynamicGenres = useMemo(() => {
    const allGenres = books.map(b => (b.genre || b.жанр || 'Без жанра'));
    return ['Все', ...new Set(allGenres)];
  }, [books]);

  const filtered = filter === 'Все' ? books : books.filter(b => (b.genre || b.жанр || 'Без жанра') === filter);

  return (
    <>
      <div className="filter-bar">
        {dynamicGenres.map(g => (
          <button key={g} className={`filter-btn ${filter === g ? 'active' : ''}`} onClick={() => setFilter(g)}>{g}</button>
        ))}
      </div>
      <div className="grid">
        {filtered.map(b => {
          // Определяем, доступна ли книга для заказа (count > 0)
          const isAvailable = Number(b.count) > 0;
          
          return (
            <div key={b.docId} className="book-card">
              <img src={b.image || b.имидж} className="book-img" alt="" />
              <h4 style={{margin: '10px 0 5px', fontSize: '0.85rem'}}>{b.title || b.титул}</h4>
              <p style={{fontSize: '0.75rem', color: '#8b949e', margin: '0 0 5px'}}>Автор: {b.author || b.автор || 'Не указан'}</p>
              
              {/* Показываем количество */}
              <p style={{fontSize: '0.75rem', color: '#fff', margin: '0 0 10px'}}>В наличии: {b.count || 0} шт.</p>
              
              <div style={{fontSize: '10px', fontWeight: 'bold', color: isAvailable ? '#2ecc71' : '#f85149'}}>
                {isAvailable ? 'В наличии' : (b.status || 'Выдана')}
              </div>
              
              {isAvailable ? (
                <Link to="/order" state={{t: b.title || b.титул, id: b.docId, currentCount: b.count}} className="btn">ВЗЯТЬ</Link>
              ) : (
                <div className="btn" style={{background: '#333'}}>
                  {b.status === 'Заказана' ? 'ЗАКАЗАНА' : 'ВЫДАНА'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// --- [АДМИНКА] ---
const Admin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [orders, setOrders] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: '', image: '', status: 'В наличии', count: 1 });

  useEffect(() => {
    const checkPassword = async () => {
      const p = prompt("Пароль:");
      if (!p) { window.location.href = "#/"; return; }

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: p })
        });
        const data = await res.json();

        if (data.success) {
          setIsAuth(true);
        } else {
          alert(data.message);
          if (data.banned) {
            document.body.innerHTML = "<div style='background:black;color:red;height:100vh;display:flex;align-items:center;justify-content:center;'><h1>ЗАБЛОКИРОВАН ЗА ПРЕВЫШЕНИЕ ПОПЫТОК</h1></div>";
          } else {
            window.location.href = "#/";
          }
        }
      } catch (e) { 
        alert("Ошибка связи с сервером");
        window.location.href = "#/"; 
      }
    };
    checkPassword();
  }, []);

  // Сортировка по новизне (createdAt)
  useEffect(() => { 
    if (isAuth) {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      return onSnapshot(q, s => {
        setOrders(s.docs.map(d => ({id: d.id, ...d.data()})));
      });
    }
  }, [isAuth]);

  // Добавление книг со всеми полями
  const addBook = async () => {
    const q = query(collection(db, "books"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(q);
    let nextId = snap.empty ? 1 : Number(snap.docs[0].data().id) + 1;

    await addDoc(collection(db, "books"), { 
      ...newBook, 
      id: nextId, 
      count: Number(newBook.count),
      createdAt: Date.now() 
    });
    alert(`Книга добавлена! ID: ${nextId}`);
    setNewBook({ title: '', author: '', genre: '', image: '', status: 'В наличии', count: 1 });
  };

  // Кнопки ВЫДАТЬ / ВЕРНУТЬ
  const setStatus = async (oid, bid, newStatus, currentCount) => {
    await updateDoc(doc(db, "orders", oid), { status: newStatus });
    if (bid) {
      let updatedCount = Number(currentCount || 0);
      if (newStatus === 'В наличии (возврат)') {
         updatedCount += 1;
         await updateDoc(doc(db, "books", bid), { status: 'В наличии', count: updatedCount });
      } else {
         await updateDoc(doc(db, "books", bid), { status: newStatus });
      }
    }
  };

  if (!isAuth) return <h2 style={{textAlign:'center', marginTop:'50px'}}>Проверка...</h2>;

  return (
    <div className="box" style={{maxWidth: '800px'}}>
      <h2 style={{color: 'var(--main-red)', textAlign: 'center'}}>Панель Учителя</h2>
      
      {/* Твоя полная форма добавления */}
      <div className="box" style={{background: '#000', margin: '20px 0'}}>
         <h4>Добавить новую книгу</h4>
         <input className="input" placeholder="Название" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
         <input className="input" placeholder="Автор" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
         <input className="input" placeholder="Жанр" value={newBook.genre} onChange={e => setNewBook({...newBook, genre: e.target.value})} />
         <input className="input" placeholder="URL обложки" value={newBook.image} onChange={e => setNewBook({...newBook, image: e.target.value})} />
         <input className="input" type="number" placeholder="Количество" value={newBook.count} onChange={e => setNewBook({...newBook, count: e.target.value})} />
         <button className="btn" style={{background: 'green'}} onClick={addBook}>СОХРАНИТЬ</button>
      </div>
      
      <h3>Заказы (Новые сверху)</h3>
      {orders.map(o => (
        <div key={o.id} className="admin-row">
          <div>
            <b>{o.book}</b><br/>
            <small>{o.fio} {o.class}</small><br/>
            <span style={{fontSize: '12px'}}>Статус: {o.status || 'Заказана'}</span></div>
          <div>
            {(o.status === 'Заказана' || !o.status) && (
              <button className="btn-small" style={{background:'green'}} onClick={() => setStatus(o.id, o.bookId, 'Выдана', o.bookCount)}>ВЫДАТЬ</button>
            )}
            {o.status === 'Выдана' && (
              <button className="btn-small" style={{background:'#3498db'}} onClick={() => setStatus(o.id, o.bookId, 'В наличии (возврат)', o.bookCount)}>ВЕРНУТЬ</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- [ГЛАВНАЯ] ---
const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true); // Добавим лоадер для проверки

  useEffect(() => {
    // Проверь, чтобы в Firebase коллекция называлась именно "events"
    const q = collection(db, "events");
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({
        id: d.id, 
        ...d.data()
      }));
      console.log("Данные из БД:", items); // Глянь в консоль браузера (F12)
      setEvents(items);
      setLoading(false);
    }, (error) => {
      console.error("Ошибка Firebase:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div style={{maxWidth: '850px', margin: '0 auto', padding: '20px', textAlign: 'center'}}>
      <img src={logoUrl} alt="logo" style={{height: '90px'}} />
      <h1>Библиотека Школы 518</h1>
      
      {loading && <p>Загрузка новостей...</p>}
      {!loading && events.length === 0 && <p>Событий пока нет</p>}

      {events.map((e) => (
        <div key={e.id} className="box" style={{maxWidth: '100%', textAlign: 'left', marginBottom: '20px'}}>
          {e.image && <img src={e.image} style={{width: '100%', borderRadius: '10px', marginBottom: '15px'}} alt="event" />}
          <h3>{e.title || "Без названия"}</h3>
          <p style={{color: '#8b949e'}}>{e.description}</p>
          <span style={{fontSize: '11px', color: '#cc2222'}}>{e.date}</span>
        </div>
      ))}
    </div>
  );
};


// --- [ПРОФИЛЬ] ---
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

// --- [АВТОРИЗАЦИЯ] ---
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

// --- [ОФОРМЛЕНИЕ ЗАКАЗА] ---
const Order = ({ user }) => {
  const { state } = useLocation();
  const nav = useNavigate();

  const confirm = async () => {
    if (!user) return nav('/auth');

    try {
      // 1. ПРОВЕРКА НА ДВОЙНОЙ ЗАКАЗ
      // Ищем все заказы этого пользователя
      const q = query(collection(db, "orders"), where("userEmail", "==", user.email));
      const snap = await getDocs(q);
      
      // Проверяем, есть ли среди них заказ на ЭТУ книгу, который еще не вернули
      const hasActiveOrder = snap.docs.some(d => 
        d.data().bookId === state.id && d.data().status !== 'В наличии (возврат)'
      );

      if (hasActiveOrder) {
        alert("Ошибка: Вы уже заказали эту книгу или она сейчас у вас на руках!");
        return; // Останавливаем выполнение
      }

      // 2. ПРОВЕРКА НАЛИЧИЯ И ОБНОВЛЕНИЕ КНИГИ
      const bookRef = doc(db, "books", state.id);
      const bookSnap = await getDoc(bookRef);
      
      if (!bookSnap.exists()) {
        alert("Книга не найдена!");
        return;
      }

      const bookData = bookSnap.data();
      const currentCount = Number(bookData.count) || 0;

      if (currentCount <= 0) {
        alert("К сожалению, эта книга только что закончилась.");
        return;
      }

      // Вычисляем новый остаток книг
      const newCount = currentCount - 1;
      // Если осталась хоть одна, статус "В наличии", если ноль - "Заказана" (закончились на полке)
      const newStatus = newCount > 0 ? "В наличии" : "Заказана";

      // Обновляем количество в базе данных книг
      await updateDoc(bookRef, { 
        count: newCount, 
        status: newStatus 
      });

      // 3. ФОРМИРУЕМ САМ ЗАКАЗ
      const uSnap = await getDoc(doc(db, "users", user.uid));
      const uData = uSnap.data();

      await addDoc(collection(db, "orders"), { 
        userEmail: user.email, 
        fio: uData?.fio || 'Не указано', 
        class: uData?.class || 'Не указан', 
        book: state.t, 
        bookId: state.id, 
        date: new Date().toLocaleDateString(), 
        status: "Заказана", // Требуемый статус
        createdAt: Date.now() // ВРЕМЯ для сортировки в админке по новизне
      });

      alert("Успешно забронировано!"); 
      nav('/profile');
      
    } catch (error) {
      console.error(error);
      alert("Произошла ошибка при оформлении. Попробуйте снова.");
    }
  };

  if (!state) return <div className="box" style={{textAlign:'center'}}>Ошибка: Книга не выбрана</div>;

  return (
    <div className="box" style={{textAlign:'center'}}>
      <h3>Взять "{state?.t}"?</h3>
      <button className="btn" onClick={confirm}>ДА, ЗАКАЗАТЬ</button>
    </div>
  );
};

// --- [МАРШРУТИЗАЦИЯ И РЕНДЕР] ---
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