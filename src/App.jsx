import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, RefreshCcw, Brain, Zap, Star, Flame, Share2, Copy, Check, Loader2, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 🔴 步驟一：Firebase 設定
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCfnMao6o2QCNY4ZuV40XATZv-VrZSK_Rg",
  authDomain: "kcvocabapp.firebaseapp.com",
  projectId: "kcvocabapp",
  storageBucket: "kcvocabapp.firebasestorage.app",
  messagingSenderId: "835597766849",
  appId: "1:835597766849:web:962ccd9b694c7e08250440"
};

// ==========================================
// 🔴 步驟二：你的最新金鑰 (已自動填入)
// ==========================================
const GEMINI_API_KEY = "AIzaSyBPzpFcXj7FnZEMy6YGaabbknoBdvsT72k";

const isCanvas = typeof __firebase_config !== 'undefined';
const activeKey = isCanvas ? "" : GEMINI_API_KEY;
const app = initializeApp(isCanvas ? JSON.parse(__firebase_config) : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kcvocabapp';

const App = () => {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [total, setTotal] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copyOk, setCopyOk] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [deckId, setDeckId] = useState(null);
  const [input, setInput] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. 初始化登入
  useEffect(() => {
    const init = async () => {
      if (isCanvas && typeof __initial_auth_token !== 'undefined') await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    init();
    onAuthStateChanged(auth, u => {
      setUser(u);
      const id = new URLSearchParams(window.location.search).get('deckId');
      if (!id) setLoading(false);
    });
  }, []);

  // 2. 載入資料庫進度
  useEffect(() => {
    if (!user) return;
    const id = new URLSearchParams(window.location.search).get('deckId');
    if (id) {
      setDeckId(id);
      getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', id)).then(s => {
        if (s.exists()) {
          const d = s.data();
          setCards(d.cards);
          setTotal(d.cards.length);
          setQueue(d.queue || Array.from({length: d.cards.length}, (_, i) => i));
          setHistory(d.history || { again: 0, hard: 0, good: 0, easy: 0 });
          if (d.queue?.length === 0) setIsFinished(true);
        }
        setLoading(false);
      });
    }
  }, [user]);

  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = /[a-zA-Z]/.test(t) ? 'en-US' : 'ja-JP';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const handleAction = async (type) => {
    const curr = queue[0];
    let nextQ = [...queue];
    nextQ.shift();
    const nextH = { ...history, [type]: history[type] + 1 };
    setHistory(nextH);
    if (type === 'again') nextQ.splice(1, 0, curr);
    else if (type === 'hard') nextQ.splice(Math.floor(nextQ.length/2), 0, curr);
    else if (type === 'good') nextQ.push(curr);

    if (nextQ.length === 0) setIsFinished(true);
    else { setQueue(nextQ); setIsFlipped(false); }

    if (deckId && user) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), { queue: nextQ, history: nextH });
  };

  // 3. AI 生成邏輯 - 極簡版
  const generate = async () => {
    if (!input.trim() || genLoading) return;
    setGenLoading(true); setError('');
    const isEn = /[a-zA-Z]/.test(input);
    const prompt = `萃取文字 """${input}""" 中的單字，回傳 JSON 陣列：[{"word": "...", "reading": "...", "meaning": "...", "breakdown": "...", "example_main": "...", "example_sub": "...", "example_zh": "..."}]。只回傳 JSON。`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey || GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!res.ok) throw new Error("Google 拒絕連線，可能額度爆了或金鑰權限未開");
      const data = await res.json();
      const raw = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
      
      const newCards = parsed.map(c => ({
        word: c.word,
        info: isEn 
          ? `${c.reading} ${c.meaning} 💡 [用法] ${c.breakdown} 【例句】${c.example_main}()${c.example_zh}`
          : `${c.reading} ${c.meaning} 💡 [分析] ${c.breakdown} 【例句】${c.example_main}(${c.example_sub})${c.example_zh}`
      }));

      setCards(newCards);
      setQueue(Array.from({length: newCards.length}, (_, i) => i));
      setTotal(newCards.length);
      setIsFinished(false); setIsFlipped(false);
    } catch (e) { setError(`❌ 錯誤：${e.message}`); }
    finally { setGenLoading(false); }
  };

  useEffect(() => {
    if (cards.length > 0 && !isFinished) {
      const word = cards[queue[0]].word;
      if (!imageUrls[word]) setImageUrls(p => ({ ...p, [word]: `https://loremflickr.com/500/300/${encodeURIComponent(word)}` }));
    }
  }, [queue]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  if (cards.length === 0) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
        <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-6">建立專屬字庫</h1>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="在此貼上單字..." className="w-full h-40 p-5 mb-4 bg-slate-50 border-2 rounded-3xl outline-none focus:border-indigo-500 font-medium resize-none" />
        {error && <div className="text-red-500 bg-red-50 p-4 rounded-2xl text-xs font-bold mb-4 flex items-start gap-2"><AlertTriangle size={14} className="shrink-0" /> {error}</div>}
        <button onClick={generate} disabled={genLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all">
          {genLoading ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />} {genLoading ? '連線中...' : 'AI 智慧生成單字卡'}
        </button>
        <div className="mt-8 text-slate-300 text-[10px] font-black tracking-widest uppercase">Vercel 精簡穩定版 v5.1</div>
      </div>
    </div>
  );

  if (isFinished) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center border border-slate-100 max-w-lg w-full">
        <div className="text-8xl mb-6">🌟</div>
        <h1 className="text-3xl font-black mb-8 text-slate-800">完成本日練習！</h1>
        <button onClick={() => { setQueue(Array.from({length: cards.length}, (_, i) => i)); setHistory({again:0, hard:0, good:0, easy:0}); setIsFinished(false); }} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 shadow-xl hover:bg-black"><RefreshCcw size={20} />重新開始</button>
      </div>
    </div>
  );

  const card = cards[queue[0]];
  const progress = ((total - queue.length) / total) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-800 overflow-x-hidden">
      <div className="w-full max-w-md mb-6 space-y-4">
        <div className="flex justify-between items-center px-1 text-[15px] font-black">
          <div className="bg-white px-5 py-2 rounded-full shadow-sm border flex items-center gap-2"><Brain size={18} className="text-indigo-600" />{total-queue.length}/{total}</div>
          <button onClick={async () => {
            if (!deckId) {
              const id = crypto.randomUUID();
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', id), { cards, queue, history, creator: user.uid, createdAt: new Date().toISOString() });
              setDeckId(id); window.history.pushState({}, '', `?deckId=${id}`);
            }
            const el = document.createElement('textarea'); el.value = window.location.href; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); setCopyOk(true); setTimeout(() => setCopyOk(false), 2000);
          }} className={`px-5 py-2 rounded-full shadow-md text-xs text-white ${copyOk ? 'bg-green-500' : 'bg-indigo-600'}`}>{copyOk ? '已複製' : '儲存與分享'}</button>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border shadow-inner"><div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="relative w-full max-w-md h-[65vh] min-h-[500px] perspective-1000 group" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* 正面 */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10 border border-slate-100">
            <h2 className="text-[3.5rem] font-black text-center mb-12 leading-tight">{card.word}</h2>
            <button onClick={e => { e.stopPropagation(); speak(card.word); }} className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner hover:scale-110 transition-transform"><Volume2 size={40} /></button>
            <div className="absolute bottom-10 text-slate-300 text-[11px] font-black tracking-[0.3em] uppercase animate-pulse">點擊翻面</div>
          </div>
          {/* 背面 */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[3rem] shadow-2xl flex flex-col p-6 border overflow-hidden text-left">
            <img src={imageUrls[card.word]} className="w-full h-36 object-cover rounded-3xl mb-5 shadow-inner" alt="" onError={e => e.target.src='https://loremflickr.com/500/300/japan'} />
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <div className="text-[16px] text-slate-700 font-semibold border-l-4 border-indigo-500 pl-3 leading-relaxed whitespace-pre-line">{card.info.split('💡')[0].trim()}</div>
              {card.info.split('💡').slice(1).map((s, i) => (
                <div key={i} className="bg-amber-50/70 p-3 rounded-2xl text-[13px] text-amber-900 leading-relaxed font-medium">💡 {s.split('【例句】')[0].trim()}</div>
              ))}
              {card.info.includes('【例句】') && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                   {((s) => {
                     const m = s.match(/^(.*?)\((.*?)\)(.*)$/);
                     if (!m) return <div className="text-[14px] text-slate-700">{s}</div>;
                     return <>
                       <div className="text-[15px] font-bold text-slate-800">{m[1].trim()}</div>
                       <div className="text-[12px] text-indigo-500 font-medium">{m[2].trim()}</div>
                       <div className="text-[13px] text-slate-600 mt-1 border-l-2 pl-2">{m[3].trim()}</div>
                     </>;
                   })(card.info.split('【例句】')[1])}
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-5 pt-5 border-t shrink-0">
              {[
                {id:'again', l:'Again', c:'red', i:<RefreshCcw size={18}/>},
                {id:'hard', l:'Hard', c:'orange', i:<Flame size={18}/>},
                {id:'listen', l:'Listen', c:'indigo', i:<Volume2 size={24}/>, m:true},
                {id:'good', l:'Good', c:'blue', i:<Star size={18}/>},
                {id:'easy', l:'Easy', c:'green', i:<Zap size={18}/>}
              ].map(b => (
                <button key={b.id} onClick={e => { e.stopPropagation(); if(b.id==='listen') speak(card.word); else handleAction(b.id); }} className={`flex flex-col items-center gap-1 ${b.m?'-mt-4 hover:scale-110':'hover:scale-105'} transition-all`}>
                  <div className={`${b.m?'w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl border-4 border-white':`w-11 h-11 rounded-2xl bg-${b.c}-50 text-${b.c}-600 border border-${b.c}-100 shadow-sm`} flex items-center justify-center`}>{b.i}</div>
                  <span className={`text-[10px] font-black uppercase ${b.m?'text-indigo-600':`text-${b.c}-500/80`}`}>{b.l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }` }} />
    </div>
  );
};

export default App;