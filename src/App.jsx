import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, RefreshCcw, Brain, Zap, Star, Flame, Share2, Check, Loader2, AlertTriangle, ChevronRight, Clock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// --- 1. Firebase 配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyCfnMao6o2QCNY4ZuV40XATZv-VrZSK_Rg",
  authDomain: "kcvocabapp.firebaseapp.com",
  projectId: "kcvocabapp",
  storageBucket: "kcvocabapp.firebasestorage.app",
  messagingSenderId: "835597766849",
  appId: "1:835597766849:web:962ccd9b694c7e08250440"
};

// --- 2. 你的最新 Google AI 金鑰 (nKU 版) ---
const GEMINI_API_KEY = "AIzaSyD7yp67pTR39yfiIfFamYnPEdmRr-lEnKU";

// 自動判斷環境：Canvas 介面必須用空字串，Vercel 才會用你的金鑰
const isCanvas = typeof __firebase_config !== 'undefined';
const app = initializeApp(isCanvas ? JSON.parse(__firebase_config) : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kcvocabapp';
const apiKey = isCanvas ? "" : GEMINI_API_KEY;

const App = () => {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [total, setTotal] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [deckId, setDeckId] = useState(null);
  const [input, setInput] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');

  // 初始化與資料同步
  useEffect(() => {
    (async () => {
      if (isCanvas && typeof __initial_auth_token !== 'undefined') await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    })();
    onAuthStateChanged(auth, u => {
      setUser(u);
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
      } else setLoading(false);
    });
  }, []);

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

  // AI 核心：智慧限流與降級機制
  const generate = async () => {
    if (!input.trim() || genLoading) return;
    setGenLoading(true); setError('');
    const isEn = /[a-zA-Z]/.test(input);
    // 嚴格遵守學習原則：拆解字根、意象化連結
    const prompt = isEn 
      ? `分析文字 """${input}""" 萃取出重要英文單字，回傳 JSON 陣列：[{"word": "單字", "reading": "音標", "meaning": "意思", "breakdown": "字根拆解與意象說明", "example": "例句", "example_zh": "翻譯"}]。請只回傳 JSON。`
      : `分析文字 """${input}""" 萃取出重要日文單字，回傳 JSON 陣列：[{"word": "單字", "reading": "讀音", "meaning": "意思", "breakdown": "字句拆解(例如:根強い=根+強い)與意象說明", "example": "例句", "example_zh": "翻譯"}]。請只回傳 JSON。`;

    // 🛑 Canvas 環境與 Vercel 雲端環境自動切換模型
    const targets = isCanvas 
      ? [{ v: "v1beta", m: "gemini-2.5-flash-preview-09-2025" }] 
      : [
          { v: "v1beta", m: "gemini-1.5-flash" },
          { v: "v1beta", m: "gemini-1.5-flash-8b" }
        ];

    let success = false;
    let lastError = "";

    for (const target of targets) {
      try {
        // 修正：動態套用 apiKey 變數 (Canvas為空，Vercel為真)
        const res = await fetch(`https://generativelanguage.googleapis.com/${target.v}/models/${target.m}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          if (res.status === 429) {
            const errMsg = data.error?.message || "";
            if (errMsg.includes("limit: 0")) {
              lastError = `模型 ${target.m} 無免費額度`;
              continue; 
            } else {
              throw new Error("⚠️ 請求太快了！Google 限制每分鐘 15 次，請等 30 秒後再點擊一次。");
            }
          }
          throw new Error(data.error?.message || "Google 拒絕連線");
        }
        
        const raw = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
        
        const newCards = parsed.map(c => ({
          word: c.word,
          info: `${c.reading} ${c.meaning} 💡 [分析] ${c.breakdown} 【例句】${c.example}()${c.example_zh}`
        }));
        
        setCards(newCards);
        setQueue(Array.from({length: newCards.length}, (_, i) => i));
        setTotal(newCards.length);
        setIsFinished(false); setIsFlipped(false);
        success = true;
        break; 
      } catch (e) { 
        lastError = e.message; 
        if (e.message.includes("請求太快")) break; 
      }
    }

    if (!success) setError(`❌ ${lastError}`);
    setGenLoading(false);
  };

  useEffect(() => {
    if (cards.length > 0 && !isFinished) {
      const word = cards[queue[0]].word;
      if (!imageUrls[word]) setImageUrls(p => ({ ...p, [word]: `https://loremflickr.com/500/300/${encodeURIComponent(word)}` }));
    }
    if (isFlipped && queue.length > 0) speak(cards[queue[0]].word);
  }, [queue, isFlipped]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (cards.length === 0) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
        <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-6">建立專屬字庫</h1>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="貼上想背的單字..." className="w-full h-40 p-5 mb-4 bg-slate-50 border-2 rounded-3xl outline-none focus:border-indigo-500 font-medium resize-none shadow-inner" />
        
        {error && (
          <div className={`p-4 rounded-2xl text-[11px] font-bold mb-4 text-left flex gap-2 leading-relaxed ${error.includes('請求太快') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-500 border border-red-100'}`}>
            {error.includes('請求太快') ? <Clock size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
            {error}
          </div>
        )}

        <button onClick={generate} disabled={genLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {genLoading ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />} {genLoading ? '請求中...' : 'AI 智慧生成單字卡'}
        </button>
        <div className="mt-8 text-slate-300 text-[10px] font-black tracking-widest uppercase">Vercel 畫布雲端雙棲版 v5.8</div>
      </div>
    </div>
  );

  if (isFinished) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border max-w-lg w-full">
        <div className="text-8xl mb-6">🌟</div>
        <h1 className="text-3xl font-black mb-8">完成練習！</h1>
        <button onClick={() => { setQueue(Array.from({length: cards.length}, (_, i) => i)); setHistory({again:0, hard:0, good:0, easy:0}); setIsFinished(false); }} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all"><RefreshCcw size={20} />重新開始</button>
      </div>
    </div>
  );

  const card = cards[queue[0]];
  
  const btnConfig = [
    { id: 'again', label: 'Again', color: 'red', icon: <RefreshCcw size={18} /> },
    { id: 'hard', label: 'Hard', color: 'orange', icon: <Flame size={18} /> },
    { id: 'listen', label: 'Listen', color: 'indigo', icon: <Volume2 size={24} />, special: true },
    { id: 'good', label: 'Good', color: 'blue', icon: <Star size={18} /> },
    { id: 'easy', label: 'Easy', color: 'green', icon: <Zap size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-800 overflow-x-hidden">
      <div className="w-full max-w-md mb-6 space-y-4">
        <div className="flex justify-between items-center px-1 text-[15px] font-black">
          <div className="bg-white px-5 py-2 rounded-full shadow-sm border flex items-center gap-2 text-slate-600"><Brain size={18} className="text-indigo-600" />{total-queue.length}/{total}</div>
          <button onClick={async () => {
            if (!deckId) {
              const id = crypto.randomUUID();
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', id), { cards, queue, history, creator: user.uid, createdAt: new Date().toISOString() });
              setDeckId(id); window.history.pushState({}, '', `?deckId=${id}`);
            }
            const el = document.createElement('textarea'); el.value = window.location.href; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); setCopyOk(true); setTimeout(() => setCopyOk(false), 2000);
          }} className={`px-5 py-2 rounded-full shadow-md text-xs text-white transition-all ${copyOk ? 'bg-green-500' : 'bg-indigo-600'}`}>{copyOk ? '已複製' : '雲端存檔'}</button>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border shadow-inner"><div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${((total - queue.length)/total)*100}%` }} /></div>
      </div>

      <div className="relative w-full max-w-md h-[65vh] min-h-[500px] perspective-1000 group" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10 border text-center">
            <h2 className="text-[3.5rem] font-black mb-12 leading-tight break-words w-full">{card.word}</h2>
            <button onClick={e => { e.stopPropagation(); speak(card.word); }} className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner hover:scale-110 transition-transform"><Volume2 size={40} /></button>
            <div className="absolute bottom-10 text-slate-300 text-[11px] font-black tracking-widest uppercase animate-pulse">點擊翻面</div>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[3rem] shadow-2xl flex flex-col p-6 border overflow-hidden">
            <img src={imageUrls[card.word]} className="w-full h-36 object-cover rounded-3xl mb-5 shadow-inner border border-slate-50" alt="" onError={e => e.target.src='https://loremflickr.com/500/300/japan'} />
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar text-left">
              <div className="text-[18px] text-slate-800 font-bold border-l-4 border-indigo-500 pl-3 leading-relaxed whitespace-pre-line">{card.info.split('💡')[0].trim()}</div>
              {card.info.split('💡').slice(1).map((s, i) => (
                <div key={i} className="bg-amber-50/70 p-3 rounded-2xl text-[13px] text-amber-900 leading-relaxed font-medium">💡 {s.split('【例句】')[0].trim()}</div>
              ))}
              {card.info.includes('【例句】') && (
                <div className="bg-slate-50/80 p-4 rounded-2xl border text-[14px] text-slate-700 leading-relaxed">
                  {((s) => {
                     const m = s.match(/^(.*?)\((.*?)\)(.*)$/);
                     if (!m) return s;
                     return <>
                       <div className="text-[15px] font-bold text-slate-800 leading-tight">{m[1].trim()}</div>
                       <div className="text-[12px] font-medium text-indigo-500">{m[2].trim()}</div>
                       <div className="text-[13px] text-slate-600 mt-1 border-l-2 pl-2 border-slate-200">{m[3].trim()}</div>
                     </>;
                   })(card.info.split('【例句】')[1])}
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-5 pt-5 border-t shrink-0">
              {btnConfig.map(btn => (
                <button key={btn.id} onClick={e => { e.stopPropagation(); btn.id==='listen'?speak(card.word):handleAction(btn.id); }} className={`flex flex-col items-center gap-1 ${btn.special?'-mt-4 hover:scale-110':'hover:scale-105'} transition-all`}>
                  <div className={`${btn.special?'w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl border-4 border-white':`w-11 h-11 rounded-2xl bg-${btn.color}-50 text-${btn.color}-600 border border-${btn.color}-100 shadow-sm`} flex items-center justify-center`}>{btn.icon}</div>
                  <span className={`text-[10px] font-black uppercase ${btn.special?'text-indigo-600':`text-${btn.color}-500/80`}`}>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }` }} />
    </div>
  );
};

export default App;