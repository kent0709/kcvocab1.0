import React, { useState, useEffect } from 'react';
import { 
  Volume2, RefreshCcw, Brain, Zap, Star, Flame, Share2, Check, Loader2, AlertTriangle, ChevronRight, Clock, Home, Trophy
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// --- 1. Firebase 配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyCfnMao6o2QCNY4ZuV40XATZv-VrZSK_Rg",
  authDomain: "kcvocabapp.firebaseapp.com",
  databaseURL: "https://kcvocabapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kcvocabapp",
  storageBucket: "kcvocabapp.firebasestorage.app",
  messagingSenderId: "835597766849",
  appId: "1:835597766849:web:962ccd9b694c7e08250440",
  measurementId: "G-C1SDRQR6MS"
};

// --- 2. Google AI 金鑰 ---
// 採用相容性更高的寫法，避免在部分舊版編譯環境中出現警告
let GEMINI_API_KEY = "";
try {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
  GEMINI_API_KEY = env?.VITE_GEMINI_API_KEY || "";
} catch (e) {
  // 靜默攔截環境變數讀取錯誤
}

// 自動判斷環境
const isCanvas = typeof __firebase_config !== 'undefined';
const app = initializeApp(isCanvas ? JSON.parse(__firebase_config) : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : 'kcvocabapp';
const apiKey = isCanvas ? "" : GEMINI_API_KEY;

// 安全更新網址列，避免在特定環境中產生錯誤
const safePushState = (url) => {
  try {
    const hostname = window.location.hostname;
    if (
      window.location.protocol === 'blob:' || 
      window.origin === 'null' || 
      hostname.includes('webcontainer') || 
      hostname.includes('stackblitz') ||
      hostname.includes('usercontent')
    ) {
      return;
    }
    window.history.pushState({}, '', url);
  } catch (e) {
    // 靜默攔截
  }
};

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
  
  // 自訂彈窗狀態
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', message: '' });

  // 1. 系統登入初始化
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isCanvas && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("登入錯誤", err);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 2. 載入資料庫存檔
  useEffect(() => {
    if (!user) return; 
    
    const id = new URLSearchParams(window.location.search).get('deckId');
    if (id) {
      setDeckId(id);
      getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', id))
        .then(s => {
          if (s.exists()) {
            const d = s.data();
            setCards(d.cards);
            setTotal(d.cards.length);
            setQueue(d.queue || Array.from({length: d.cards.length}, (_, i) => i));
            setHistory(d.history || { again: 0, hard: 0, good: 0, easy: 0 });
            if (d.queue?.length === 0) setIsFinished(true);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("資料讀取失敗", err);
          if (err.message.includes("permissions")) {
            setError("❌ 資料庫權限不足！");
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = /[a-zA-Z]/.test(t) ? 'en-US' : 'ja-JP';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const getSpeakableText = (c) => {
    if (!c) return "";
    let textToSpeak = c.word;
    let ex = null;
    if (c.info && c.info.includes('【例句】')) {
      ex = c.info.split('【例句】')[1];
    } else if (c.example) {
      ex = c.example;
    }
    if (ex) {
      const sentence = ex.split('(')[0].trim();
      if (sentence) textToSpeak += "。 " + sentence;
    }
    return textToSpeak;
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
    
    if (deckId && user) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), { queue: nextQ, history: nextH });
      } catch(err) {
        console.error("更新進度失敗", err);
      }
    }
  };

  const openConfirm = (type, message) => setConfirmDialog({ isOpen: true, type, message });
  const closeConfirm = () => setConfirmDialog({ isOpen: false, type: '', message: '' });

  const executeConfirm = () => {
    if (confirmDialog.type === 'home') {
      setCards([]);
      setQueue([]);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false);
      setIsFlipped(false);
      setDeckId(null);
      setInput('');
      safePushState(window.location.pathname);
    } else if (confirmDialog.type === 'finish') {
      setIsFinished(true);
    }
    closeConfirm();
  };

  const generate = async () => {
    if (!input.trim() || genLoading) return;
    
    if (!isCanvas && (!apiKey || apiKey.includes("xxxxxxxx"))) {
      setError('❌ 尚未在 Vercel 設定 VITE_GEMINI_API_KEY 環境變數！');
      return;
    }

    setGenLoading(true); setError('');
    const isEn = /[a-zA-Z]/.test(input);
    
    // 💡 智慧語系翻譯指令
    const prompt = isEn 
      ? `請分析以下文字：\n"""${input}"""\n這是一份「英文學習清單」。請提取出英文單字。\n⚠️極度重要：如果文字中混雜了單獨的「中文詞彙」（代表使用者不知道那個字的英文怎麼拼），請務必自動將該中文「翻譯成英文單字」，並作為一張新的英文單字卡加入清單中！\n回傳 JSON 陣列：[{"word": "英文單字", "reading": "音標", "meaning": "詞性與意思", "breakdown": "字根拆解與意象說明 (請用生動通用的比喻幫助記憶)", "example": "英文例句", "example_kana": "", "example_zh": "翻譯"}]。請只回傳 JSON。`
      : `請分析以下文字：\n"""${input}"""\n這是一份「日文學習清單」。\n⚠️極度重要：即使使用者輸入的全部都是「純中文」，你也必須把它當作是想要學習的目標，自動將這些中文「翻譯成對應的日文單字」，並為其建立日文單字卡！\n回傳 JSON 陣列：[{"word": "日文單字(若來源為中文請翻譯成日文)", "reading": "讀音", "meaning": "詞性與意思 (若是動詞，務必明確標註為：第一/二/三類動詞)", "breakdown": "字句拆解(例如:根強い=根+強い)與意象說明 (請用生動通用的比喻幫助記憶)", "example": "例句", "example_kana": "例句平假名", "example_zh": "翻譯"}]。請只回傳 JSON。`;

    const targets = [
      { v: "v1beta", m: "gemini-2.5-flash-preview-09-2025" },
      { v: "v1beta", m: "gemini-2.5-flash" },
      { v: "v1beta", m: "gemini-1.5-pro" }
    ];

    let success = false;
    let lastError = "";

    for (const target of targets) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/${target.v}/models/${target.m}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          const errMsg = data.error?.message || "";
          
          if (res.status === 400 || res.status === 403) {
            lastError = `API 金鑰無效或已被 Google 停權。請申請一把「全新」的金鑰替換！`;
            break; 
          }

          if (res.status === 429) {
            if (errMsg.includes("limit: 0")) {
              lastError = `此地區/帳號無免費額度`;
              continue; 
            } else {
              lastError = "⚠️ 請求太快了！Google 限制每分鐘 15 次，請等 30 秒後再試。";
              break;
            }
          }
          
          lastError = errMsg;
          continue; 
        }
        
        const raw = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
        
        const newCards = parsed.map(c => ({
          word: c.word,
          reading: c.reading || '',
          meaning: c.meaning || '',
          breakdown: c.breakdown || '',
          example: c.example || '',
          example_kana: c.example_kana || '',
          example_zh: c.example_zh || '',
          info: `${c.reading || ''} ${c.meaning || ''} 💡 [分析] ${c.breakdown || ''} 【例句】${c.example || ''}(${c.example_kana || ''})${c.example_zh || ''}`
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

    if (!success) setError(`${lastError}`);
    setGenLoading(false);
  };

  useEffect(() => {
    if (cards.length > 0 && !isFinished) {
      const word = cards[queue[0]].word;
      if (!imageUrls[word]) setImageUrls(p => ({ ...p, [word]: `https://loremflickr.com/500/300/${encodeURIComponent(word)}` }));
    }
    if (isFlipped && queue.length > 0) speak(getSpeakableText(cards[queue[0]]));
  }, [queue, isFlipped]);

  const getRating = () => {
    const t = history.again + history.hard + history.good + history.easy;
    if (t === 0) return { score: 0, text: "尚未作答", color: "text-slate-500", emoji: "🤔" };
    const score = Math.round(((history.easy * 100) + (history.good * 100) + (history.hard * 50)) / t);
    if (score >= 90) return { score, text: "極佳", color: "text-green-500", emoji: "🏆" };
    if (score >= 60) return { score, text: "穩定", color: "text-blue-500", emoji: "🌟" };
    return { score, text: "加油", color: "text-orange-500", emoji: "💪" };
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

  if (cards.length === 0) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
        <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
        {/* 客製化調整：替換標題為 Killer Cards */}
        <h1 className="text-2xl font-black mb-6 text-slate-800">Killer Cards</h1>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="貼上想背的單字..." className="w-full h-40 p-5 mb-4 bg-slate-50 border-2 rounded-3xl outline-none focus:border-indigo-500 font-medium resize-none shadow-inner" />
        
        {error && (
          <div className={`p-4 rounded-2xl text-[12px] font-bold mb-4 text-left flex gap-2 leading-relaxed ${error.includes('權限不足') || error.includes('請求太快') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {error.includes('請求太快') ? <Clock size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
            {error}
          </div>
        )}

        <button onClick={generate} disabled={genLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {genLoading ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />} {genLoading ? '請求中...' : 'AI 智慧生成單字卡'}
        </button>
        {/* 客製化調整：加上 byKC 簽名 */}
        <div className="mt-8 text-slate-300 text-[10px] font-black tracking-widest uppercase">v9.5 終極隱形金鑰版 byKC</div>
      </div>
    </div>
  );

  if (isFinished) {
    const r = getRating();
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md w-full">
          <div className="text-7xl mb-4 animate-bounce drop-shadow-md">{r.emoji}</div>
          <h1 className="text-2xl font-black mb-2 text-slate-800">完成本日練習！</h1>
          
          <div className={`text-5xl font-black ${r.color} mb-6`}>
            {r.score} <span className="text-xl text-slate-400 font-bold ml-1">分 - {r.text}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-8">
            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex flex-col items-center justify-center">
              <p className="text-red-600 font-black text-xl mb-1">{history.again}</p>
              <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest">Again</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex flex-col items-center justify-center">
              <p className="text-orange-600 font-black text-xl mb-1">{history.hard}</p>
              <p className="text-orange-500 text-[9px] font-bold uppercase tracking-widest">Hard</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex flex-col items-center justify-center">
              <p className="text-blue-600 font-black text-xl mb-1">{history.good}</p>
              <p className="text-blue-500 text-[9px] font-bold uppercase tracking-widest">Good</p>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
              <p className="text-green-600 font-black text-xl mb-1">{history.easy}</p>
              <p className="text-green-500 text-[9px] font-bold uppercase tracking-widest">Easy</p>
            </div>
          </div>

          <button onClick={() => { setQueue(Array.from({length: cards.length}, (_, i) => i)); setHistory({again:0, hard:0, good:0, easy:0}); setIsFinished(false); }} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all">
            <RefreshCcw size={18} />重新開始
          </button>
        </div>
      </div>
    );
  }

  const card = cards[queue[0]];
  
  let d_word = card.word;
  let d_reading = card.reading;
  let d_meaning = card.meaning;
  let d_breakdowns = [];
  let d_example = card.example ? `${card.example}(${card.example_kana || ''})${card.example_zh}` : null;

  if (card.info) {
    const splitByLight = card.info.split('💡');
    if (!d_reading && !d_meaning) {
       const firstPart = splitByLight[0].trim();
       const spaceIdx = firstPart.indexOf(' ');
       if (spaceIdx !== -1) {
           d_reading = firstPart.substring(0, spaceIdx).trim();
           d_meaning = firstPart.substring(spaceIdx).trim();
       } else {
           d_reading = "";
           d_meaning = firstPart;
       }
    }
    
    splitByLight.slice(1).forEach(part => {
        if(part.includes('【例句】')) {
            const b = part.split('【例句】')[0].replace(/\[.*?\]/, '').trim();
            if(b) d_breakdowns.push(b);
            if(!d_example) d_example = part.split('【例句】')[1].trim();
        } else {
            if(part.trim()) d_breakdowns.push(part.replace(/\[.*?\]/, '').trim());
        }
    });
    
    if (splitByLight[0].includes('【例句】') && !d_example) {
        d_example = splitByLight[0].split('【例句】')[1].trim();
    }
  }

  if (d_reading && d_reading.startsWith('(') && d_reading.endsWith(')')) {
      d_reading = d_reading.slice(1, -1);
  }
  
  const btnConfig = [
    { id: 'again', label: 'Again', color: 'red', icon: <RefreshCcw size={18} /> },
    { id: 'hard', label: 'Hard', color: 'orange', icon: <Flame size={18} /> },
    { id: 'listen', label: 'Listen', color: 'indigo', icon: <Volume2 size={24} />, special: true },
    { id: 'good', label: 'Good', color: 'blue', icon: <Star size={18} /> },
    { id: 'easy', label: 'Easy', color: 'green', icon: <Zap size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-800 overflow-x-hidden">
      
      {/* 自訂確認彈窗 */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-800 mb-6">{confirmDialog.message}</h3>
            <div className="flex gap-3">
              <button onClick={closeConfirm} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">取消</button>
              <button onClick={executeConfirm} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md">確定</button>
            </div>
          </div>
        </div>
      )}

      {/* 畫面頂部提示區 */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="w-full max-w-md mb-6 space-y-4">
        <div className="flex justify-between items-center gap-2">
          {/* 回到首頁按鈕 */}
          <button onClick={() => openConfirm('home', '確定要放棄目前的進度，回到首頁嗎？')} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-red-500 transition-all shrink-0" title="回到首頁換單字">
            <Home size={18} />
          </button>

          {/* 進度顯示 */}
          <div className="flex-1 bg-white h-10 rounded-full shadow-sm border border-slate-200 flex items-center justify-center gap-2 text-slate-600 font-black text-[15px]">
            <Brain size={18} className="text-indigo-600" />
            {total-queue.length} / {total}
          </div>

          {/* 提前結算按鈕 */}
          <button onClick={() => openConfirm('finish', '確定要提前結束，查看目前的結算分數嗎？')} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-amber-500 transition-all shrink-0" title="提前結算看分數">
            <Trophy size={18} />
          </button>

          {/* 儲存與分享按鈕 */}
          <button onClick={async () => {
            if (!user) {
              setError("❌ 系統正在連線到資料庫，請稍候再試！");
              setTimeout(() => setError(""), 3000);
              return;
            }
            try {
              let shareId = deckId;
              if (!shareId) {
                shareId = crypto.randomUUID();
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', shareId), { cards, queue, history, creator: user.uid, createdAt: new Date().toISOString() });
                setDeckId(shareId); 
                safePushState(`?deckId=${shareId}`);
              }
              const shareUrl = `${window.location.origin}${window.location.pathname}?deckId=${shareId}`;
              
              // 💡 更強大的複製邏輯，確保各種裝置都能順利複製
              try {
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(shareUrl);
                } else {
                  const el = document.createElement('textarea'); el.value = shareUrl; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
                }
              } catch (copyErr) {
                console.warn("剪貼簿自動複製被阻擋，但資料已成功儲存！");
              }

              setCopyOk(true); 
              setTimeout(() => setCopyOk(false), 2000);
            } catch (err) {
              if (err.message.includes("permissions")) {
                setError("❌ 資料庫權限不足！請至 Firebase 將規則改為 allow read, write: if true;");
              } else {
                setError("❌ 儲存失敗：" + err.message);
              }
              setTimeout(() => setError(""), 3000);
            }
          }} className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md text-white transition-all shrink-0 ${copyOk ? 'bg-green-500 scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}`} title="儲存與分享">
            {copyOk ? <Check size={16} /> : <Share2 size={16} />}
          </button>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border shadow-inner"><div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${((total - queue.length)/total)*100}%` }} /></div>
      </div>

      <div className="relative w-full max-w-md h-[68vh] min-h-[520px] perspective-1000 group" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10 border text-center">
            <h2 className="text-[3.5rem] font-black mb-12 leading-tight break-words w-full text-slate-800">{card.word}</h2>
            <button onClick={e => { e.stopPropagation(); speak(card.word); }} className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner hover:scale-110 transition-transform"><Volume2 size={40} /></button>
            <div className="absolute bottom-10 text-slate-300 text-[11px] font-black tracking-widest uppercase animate-pulse">點擊翻面</div>
          </div>
          
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[3rem] shadow-2xl flex flex-col p-6 border overflow-hidden">
            {imageUrls[card.word] && (
              <img src={imageUrls[card.word]} className="w-full h-28 object-cover rounded-2xl mb-4 shadow-inner border border-slate-50 shrink-0" alt="" onError={e => e.target.src='https://loremflickr.com/500/300/japan'} />
            )}

            <div className="flex-1 overflow-y-auto px-1 custom-scrollbar text-center flex flex-col">
              <div className="mb-4 pb-4 border-b border-slate-100 shrink-0">
                <div className="text-[28px] font-black text-slate-800 leading-tight mb-2">{d_word}</div>
                {d_reading && <div className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block mb-3 border border-indigo-100/50">({d_reading})</div>}
                <div className="text-[17px] font-bold text-slate-700">{d_meaning}</div>
              </div>

              <div className="text-left space-y-3">
                {d_breakdowns.map((b, i) => (
                  <div key={i} className="bg-amber-50/70 p-3 rounded-2xl text-[13px] text-amber-900 font-medium leading-relaxed shadow-sm">💡 {b}</div>
                ))}
                
                {d_example && (
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 shadow-sm">
                    {((s) => {
                       const m = s.match(/^(.*?)\((.*?)\)(.*)$/);
                       if (!m) return <div className="text-[14px] text-slate-700 leading-relaxed">{s}</div>;
                       
                       // 💡 判斷是否為英文單字：如果是英文，強制不顯示中間的括號列！
                       const isEnglish = /[a-zA-Z]/.test(card.word);
                       
                       return <>
                         <div className="text-[16px] font-bold text-slate-800 leading-tight mb-2">{m[1].trim()}</div>
                         {m[2].trim() && !isEnglish && <div className="text-[14px] font-medium text-indigo-600 mb-2">({m[2].trim()})</div>}
                         <div className="text-[14px] font-bold text-slate-700 mt-1">{m[3].trim()}</div>
                       </>;
                     })(d_example)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t shrink-0">
              {btnConfig.map(btn => (
                <button 
                  key={btn.id} 
                  onClick={e => { 
                    e.stopPropagation(); 
                    btn.id==='listen' ? speak(getSpeakableText(card)) : handleAction(btn.id); 
                  }} 
                  className={`flex flex-col items-center gap-1 ${btn.special?'-mt-4 hover:scale-110':'hover:scale-105'} transition-all`}
                >
                  <div className={`${btn.special?'w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl border-4 border-white':`w-11 h-11 rounded-2xl bg-${btn.color}-50 text-${btn.color}-600 border border-${btn.color}-100 shadow-sm`} flex items-center justify-center`}>{btn.icon}</div>
                  <span className={`text-[10px] font-black uppercase ${btn.special?'text-indigo-600':`text-${btn.color}-500/80`}`}>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }` }} />
    </div>
  );
};

export default App;