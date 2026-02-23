import React, { useState } from 'react';

const initialBooks = [
  { id: 1, title: "Преступление и наказание", author: "Ф. Достоевский" },
  { id: 2, title: "Мастер и Маргарита", author: "М. Булгаков" },
  { id: 3, title: "Евгений Онегин", author: "А. Пушкин" },
  { id: 4, title: "Герой нашего времени", author: "М. Лермонтов" }
];

export default function App() {
  const [form, setForm] = useState({ name: '', book: '' });
  const [status, setStatus] = useState('');

  const G_URL = "https://script.google.com/macros/s/AKfycbxHUuiJV9xvXplyqfH_uWyippqguflWydVYW8JbRM1eZ-U7NoDgI7oZOtmqgwM6FkOA0w/exec";

  const sendOrder = async (e) => {
    e.preventDefault();
    setStatus('Отправка...');
    
    try {
      await fetch(G_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(form)
      });
      
      setStatus('Заявка принята! Проверь таблицу.');
      setForm({ name: '', book: '' });
    } catch (err) {
      setStatus('Ошибка соединения');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <nav className="flex justify-between items-center mb-12 border-b border-slate-700 pb-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black italic text-cyan-400 tracking-tighter">БИБЛИОТЕКА 518</h1>
        <a href="https://518shkola.oshkole.ru" target="_blank" className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-600 transition-all text-sm">Сайт школы</a>
      </nav>

      <main className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Каталог книг</h2>
        
        <div className="grid gap-4 mb-12">
          {initialBooks.map(book => (
            <div key={book.id} className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all">
              <div className="font-bold text-xl text-white">{book.title}</div>
              <div className="text-slate-400 italic text-sm">{book.author}</div>
            </div>
          ))}
        </div>

        <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 text-cyan-400">Заказать книгу</h3>
          <form className="space-y-4" onSubmit={sendOrder}>
            <input 
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              type="text" 
              placeholder="Твоё имя" 
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors" 
            />
            <input 
              required
              value={form.book}
              onChange={e => setForm({...form, book: e.target.value})}
              type="text" 
              placeholder="Название книги" 
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors" 
            />
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-95">Отправить заявку</button>
            {status && <p className="mt-4 text-center text-cyan-400 font-medium animate-pulse">{status}</p>}
          </form>
        </section>
      </main>

      <footer className="mt-20 border-t border-slate-800 pt-8 text-center">
        <p className="text-slate-500 text-sm tracking-widest uppercase font-semibold">Сделано учеником 518 школы</p>
      </footer>
    </div>
  );
}
