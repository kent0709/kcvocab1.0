import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Volume2, 
  Upload, 
  RefreshCcw, 
  CheckCircle2, 
  Trophy,
  Brain, 
  Zap, 
  Star, 
  Flame, 
  Share2, 
  Copy, 
  Check, 
  Loader2, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 🔴 步驟一：Firebase 設定 (kcvocabapp)
// ==========================================
const myFirebaseConfig = {
  apiKey: "AIzaSyCfnMao6o2QCNY4ZuV40XATZv-VrZSK_Rg",
  authDomain: "kcvocabapp.firebaseapp.com",
  projectId: "kcvocabapp",
  storageBucket: "kcvocabapp.firebasestorage.app",
  messagingSenderId: "835597766849",
  appId: "1:835597766849:web:962ccd9b694c7e08250440",
  measurementId: "G-C1SDRQR6MS"
};

// ==========================================
// 🔴 步驟二：你的最新 Google AI 金鑰
// ==========================================
const GEMINI_API_KEY = "AIzaSyBPzpFcXj7FnZEMy6YGaabbknoBdvsT72k"; 

const isCanvasEnvironment = typeof __firebase_config !== 'undefined';
const activeConfig = isCanvasEnvironment ? JSON.parse(__firebase_config) : myFirebaseConfig;
const apiKey = isCanvasEnvironment ? "" : GEMINI_API_KEY;

const app = initializeApp(activeConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kcvocabapp';

const App = () => {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [totalInitial, setTotalInitial] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [currentDeckId, setCurrentDeckId] = useState(null);
  const [inputText, setInputText] = useState(''); 
  const [isGeneratingCards, setIsGeneratingCards] = useState(false); 
  const [genError, setGenError] = useState(''); 
  const [authError, setAuthError] = useState(''); 
  const translatingRef = useRef(new Set());

  // 初始化登入與資料獲取
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isCanvasEnvironment && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setAuthError('連線失敗');
        setIsLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const params = new URLSearchParams(window.location.search);
      if (!params.get('deckId') || !currentUser) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const deckId = params.get('deckId');
    if (deckId) {
      setCurrentDeckId(deckId);
      (async () => {
        setIsLoading(true);
        try {
          const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCards(data.cards);
            setTotalInitial(data.cards.length);
            setQueue(data.queue || Array.from({ length: data.cards.length }, (_, i) => i));
            setHistory(data.history || { again: 0, hard: 0, good: 0, easy: 0 });
            if (data.queue?.length === 0) setIsFinished(true);
          }
        } catch (err) {} finally { setIsLoading(false); }
      })();
    } else { setIsLoading(false); }
  }, [user]);

  // 工具函式：語音與格式化
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = /[a-zA-Z]/.test(text) ? 'en-US' : 'ja-JP';
    u.rate = 0.85; 
    window.speechSynthesis.speak(u);
  };

  const formatExampleText = (s) => {
    if (!s) return null;
    const m = s.match(/^(.*?)\((.*?)\)(.*)$/);
    if (!m) return <div className="text-[14px] text-slate-700">{s}</div>;
    return (
      <div className="space-y-1 text-left">
        <div className="text-[15px] font-bold text-slate-800">{m[1].trim()}</div>
        {m[2].trim() && <div className="text-[12px] font-medium text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded inline-block">{m[2].trim()}</div>}
        {m[3].trim() && <div className="text-[13px] text-slate-600 mt-1 border-l-2 border-slate-200 pl-2">{m[3].trim()}</div>}
      </div>
    );
  };

  const handleSrsAction = async (type) => {
    const currentQueueIdx = queue[0];
    let newQueue = [...queue];
    newQueue.shift();
    const newHistory = { ...history, [type]: history[type] + 1 };
    setHistory(newHistory);
    
    if (type === 'again') newQueue.splice(1, 0, currentQueueIdx);
    else if (type === 'hard') newQueue.splice(Math.floor(newQueue.length / 2), 0, currentQueueIdx);
    else if (type === 'good') newQueue.push(currentQueueIdx);

    if (newQueue.length === 0) setIsFinished(true);
    else { setQueue(newQueue); setIsFlipped(false); }

    if (currentDeckId && user) {
      try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', currentDeckId), { queue: newQueue, history: newHistory }); } catch (e) {}
    }
  };

  // 精簡後的 AI 生成邏輯
  const generateCardsWithAI = async () => {
    if (!inputText.trim()) return;
    setIsGeneratingCards(true);
    setGenError('');
    if (!isCanvasEnvironment && !apiKey) { setGenError('❌ 找不到金鑰'); setIsGeneratingCards(false); return; }

    const isEn = /[a-zA-Z]/.test(inputText);
    const prompt = isEn 
      ? `分析文字 """${inputText}""" 萃取出重要英文單字，回傳 JSON 陣列：[{"word": "單字", "reading": "音標", "meaning": "意思", "derivatives": "變化", "collocations": "搭配", "example_en": "英文例句", "example_zh": "翻譯"}]。不要廢話。`
      : `分析文字 """${inputText}""" 萃取出重要日文單字，回傳 JSON 陣列：[{"word": "單字", "reading": "讀音", "meaning": "意思", "breakdown": "記憶法", "example_jp": "日文例句", "example_kana": "讀音", "example_zh": "翻譯"}]。不要廢話。`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error(response.status === 429 ? "額度用滿了，請稍後一分鐘" : "Google 連線失敗");

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());

      const newCards = parsed.map(item => ({
        word: item.word,
        info: isEn 
          ? `${item.reading || ''} ${item.meaning} 💡 [變化] ${item.derivatives || ''} 💡 [搭配] ${item.collocations || ''} 【例句】${item.example_en}()${item.example_zh}`
          : `${item.reading} ${item.meaning} 💡 [記憶] ${item.breakdown} 【例句】${item.example_jp}(${item.example_kana})${item.example_zh}`
      }));

      setCards(newCards);
      setQueue(Array.from({ length: newCards.length }, (_, i) => i));
      setTotalInitial(newCards.length);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false);
      setIsFlipped(false);
    } catch (e) {
      setGenError(`❌ ${e.message}`);
    } finally { setIsGeneratingCards(false); }
  };

  const saveAndShare = async () => {
    if (!user || cards.length === 0) return;
    setIsSaving(true);
    const deckId = crypto.randomUUID();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), { cards, queue, history, creator: user.uid, createdAt: new Date().toISOString() });
      setShareUrl(`${window.location.origin}${window.location.pathname}?deckId=${deckId}`);
      setCurrentDeckId(deckId);
      window.history.pushState({}, '', `?deckId=${deckId}`);
    } catch (err) {} finally { setIsSaving(false); }
  };

  useEffect(() => {
    if (cards.length === 0 || isFinished) return;
    const card = cards[queue[0]];
    if (!card || imageUrls[card.word] || translatingRef.current.has(card.word)) return;
    translatingRef.current.add(card.word);
    setImageUrls(prev => ({ ...prev, [card.word]: `https://loremflickr.com/500/300/${encodeURIComponent(card.word)}` }));
  }, [queue, cards, isFinished, imageUrls]);

  useEffect(() => { if (isFlipped && queue.length > 0) {
    const card = cards[queue[0]];
    let t = card.word; 
    if (card.info.includes('【例句】')) t += "、" + card.info.split('【例句】')[1].split('(')[0].trim();
    speak(t);
  }}, [isFlipped]);

  if (isLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
          <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">建立你的專屬字庫</h1>
          <p className="text-slate-400 text-sm mb-8 font-medium">貼上單字，由 AI 為你補完解釋</p>
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={isGeneratingCards} placeholder={`在這裡輸入單字...\n例如：\n車站\n食べる\nEfficiency`} className="w-full h-40 p-5 mb-4 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 transition-all outline-none font-medium resize-none text-slate-700 shadow-inner" />
          {genError && <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-2xl text-[11px] font-bold mb-5 whitespace-pre-wrap text-left shadow-sm flex items-start gap-2"><AlertTriangle size={14} /> {genError}</div>}
          <button onClick={generateCardsWithAI} disabled={isGeneratingCards || !inputText.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">{isGeneratingCards ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />} {isGeneratingCards ? '正在連線 AI...' : '✨ AI 生成單字卡'}</button>
          <div className="text-center text-slate-300 text-[10px] mt-10 font-black uppercase tracking-[0.3em]">Vercel 精簡穩定版 v5.0</div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-slate-800">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center border border-slate-100">
          <div className="text-8xl mb-6 animate-bounce">🌟</div>
          <h1 className="text-3xl font-black mb-8">完成本日練習！</h1>
          <button onClick={() => { setQueue(Array.from({ length: cards.length }, (_, i) => i)); setHistory({ again: 0, hard: 0, good: 0, easy: 0 }); setIsFinished(false); }} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl"><RefreshCcw size={22} />重新開始這一輪</button>
        </div>
      </div>
    );
  }

  const currentCard = cards[queue[0]];
  const progress = ((totalInitial - queue.length) / totalInitial) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-800 overflow-x-hidden">
      <div className="w-full max-w-md mb-6 space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100 text-[15px] font-black flex items-center gap-2 text-slate-700"><Brain size={18} className="text-indigo-600" />{totalInitial - queue.length} / {totalInitial}</div>
          <button onClick={currentDeckId || shareUrl ? () => { const el = document.createElement('textarea'); el.value = shareUrl || window.location.href; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); setCopySuccess(true); setTimeout(()=>setCopySuccess(false), 2000); } : saveAndShare} disabled={isSaving} className={`px-5 py-2.5 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-2 ${copySuccess ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'}`}>{isSaving ? <Loader2 className="animate-spin" size={14} /> : (copySuccess ? <Check size={14} /> : <Share2 size={14} />)}{copySuccess ? '已複製' : '雲端儲存'}</button>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner"><div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="relative w-full max-w-md h-[68vh] min-h-[500px] cursor-pointer perspective-1000 group" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10 border border-slate-100">
            <h2 className="text-[3.5rem] font-black text-slate-900 text-center mb-12 break-words w-full leading-tight">{currentCard.word}</h2>
            <button onClick={(e) => { e.stopPropagation(); speak(currentCard.word); }} className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner border-2 border-indigo-100/50 hover:scale-110 transition-all"><Volume2 size={40} /></button>
            <div className="absolute bottom-10 flex items-center gap-2 text-slate-300 text-[11px] font-black tracking-[0.3em] uppercase animate-pulse">點擊翻面 <ChevronRight size={14} /></div>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[3rem] shadow-2xl flex flex-col p-6 border border-slate-100 overflow-hidden text-left">
            <div className="w-full h-36 bg-slate-100 rounded-3xl mb-5 overflow-hidden shadow-inner shrink-0 border border-slate-50"><img src={imageUrls[currentCard.word]} className="w-full h-full object-cover transition-transform hover:scale-105" alt="" onError={(e) => e.target.src = 'https://loremflickr.com/500/300/japan'} /></div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div className="space-y-3">
                <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-slate-900">{currentCard.word}</span></div>
                <div className="text-[16px] text-slate-700 font-semibold border-l-4 border-indigo-500 pl-3 leading-relaxed whitespace-pre-line">{currentCard.info.split('💡')[0].trim()}</div>
                {currentCard.info.split('💡').slice(1).map((sec, i) => (
                  <div key={i} className="bg-amber-50/70 border border-amber-100 p-3 rounded-2xl text-[13px] text-amber-900 font-medium leading-relaxed">💡 {sec.split('【例句】')[0].replace(/\[.*?\]\s*/, '').trim()}</div>
                ))}
              </div>
              {currentCard.info.includes('【例句】') && <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 shadow-sm">{formatExampleText(currentCard.info.split('【例句】')[1])}</div>}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-5 pt-5 border-t border-slate-100 shrink-0">
              {[
                { type: 'again', label: 'Again', color: 'red', icon: <RefreshCcw size={18} /> },
                { type: 'hard', label: 'Hard', color: 'orange', icon: <Flame size={18} /> },
                { type: 'listen', label: 'Listen', color: 'indigo', icon: <Volume2 size={24} />, isMain: true },
                { type: 'good', label: 'Good', color: 'blue', icon: <Star size={18} /> },
                { type: 'easy', label: 'Easy', color: 'green', icon: <Zap size={18} /> }
              ].map((btn) => (
                <button 
                  key={btn.type}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (btn.type === 'listen') {
                      let t = currentCard.word; 
                      if (currentCard.info.includes('【例句】')) t += "、" + currentCard.info.split('【例句】')[1].split('(')[0].trim();
                      speak(t);
                    } else {
                      handleSrsAction(btn.type);
                    }
                  }} 
                  className={`flex flex-col items-center gap-1 ${btn.isMain ? '-mt-4 hover:scale-110 transition-transform' : 'hover:scale-105'}`}
                >
                  <div className={`${btn.isMain ? 'w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl border-4 border-white' : `w-11 h-11 rounded-2xl bg-${btn.color}-50 text-${btn.color}-600 border border-${btn.color}-100 shadow-sm`} flex items-center justify-center`}>
                    {btn.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase ${btn.isMain ? 'text-indigo-600' : `text-${btn.color}-500/80`}`}>{btn.label}</span>
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