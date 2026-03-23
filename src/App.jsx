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
  Loader2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 🔴 步驟一：你的專屬 Firebase 資料庫金鑰
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
// 🔴 步驟二：你的 Google AI 金鑰 (已填妥！)
// ==========================================
const GEMINI_API_KEY = "AIzaSyBZ5d_jU5ZJLQ9oUCLqRDi4hS3P4lfOyQQ"; 

// --- 系統自動判斷環境邏輯 ---
const isCanvasEnvironment = typeof __firebase_config !== 'undefined';
const activeConfig = isCanvasEnvironment ? JSON.parse(__firebase_config) : myFirebaseConfig;
const apiKey = isCanvasEnvironment ? "" : GEMINI_API_KEY;

const app = initializeApp(activeConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kcvocabapp';

const App = () => {
  // --- 狀態管理 (State) ---
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
  const [showRatingModal, setShowRatingModal] = useState(false); 
  const translatingRef = useRef(new Set());

  // --- Auth & Initial Data Fetch ---
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
      if (!params.get('deckId') || !currentUser) {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const deckId = params.get('deckId');
    if (deckId) {
      setCurrentDeckId(deckId);
      const fetchDeck = async () => {
        setIsLoading(true);
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCards(data.cards);
            setTotalInitial(data.cards.length);
            if (data.queue) {
              setQueue(data.queue);
              setHistory(data.history || { again: 0, hard: 0, good: 0, easy: 0 });
              if (data.queue.length === 0) setIsFinished(true);
            } else {
              setQueue(Array.from({ length: data.cards.length }, (_, i) => i));
            }
          }
        } catch (err) {} finally {
          setIsLoading(false);
        }
      };
      fetchDeck();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isEnglish = /[a-zA-Z]/.test(text);
    utterance.lang = isEnglish ? 'en-US' : 'ja-JP';
    utterance.rate = 0.9; 
    window.speechSynthesis.speak(utterance);
  };

  const getSpeakableText = (card) => {
    if (!card) return "";
    let textToSpeak = card.word; 
    if (card.info && card.info.includes('【例句】')) {
      const examplePart = card.info.split('【例句】')[1];
      if (examplePart) {
        const sentence = examplePart.split('(')[0].trim();
        textToSpeak += "、" + sentence;
      }
    }
    return textToSpeak;
  };

  const formatExampleText = (exampleString) => {
    if (!exampleString) return null;
    const match = exampleString.match(/^(.*?)\((.*?)\)(.*)$/);
    if (match) {
      return (
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-slate-800 leading-tight">{match[1].trim()}</div>
          {match[2].trim() && <div className="text-[11px] font-medium text-indigo-500">{match[2].trim()}</div>}
          {match[3].trim() && <div className="text-xs text-slate-600">{match[3].trim()}</div>}
        </div>
      );
    }
    return <div className="text-[13px] text-slate-700">{exampleString}</div>;
  };

  const formatBackHeader = (card) => {
    if (!card.info) return null;
    const mainPart = card.info.split('【例句】')[0].trim();
    const parts = mainPart.split('💡').map(p => p.trim());
    const headerText = parts[0];
    const extraSections = parts.slice(1);
    const firstSpaceIdx = headerText.indexOf(' ');
    let reading = "";
    let meaning = headerText;
    if (firstSpaceIdx !== -1) {
      reading = headerText.substring(0, firstSpaceIdx).trim();
      meaning = headerText.substring(firstSpaceIdx).trim();
    }
    return (
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-black text-indigo-900">{card.word}</span>
          {reading && <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-md">{reading}</span>}
        </div>
        <div className="text-slate-700 text-sm mb-1.5 whitespace-pre-line">{meaning}</div>
        {extraSections.map((sec, idx) => (
          <div key={idx} className="mt-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100/50 font-medium whitespace-pre-line">
            💡 {sec.replace(/\[.*?\]\s*/, '').trim()}
          </div>
        ))}
      </div>
    );
  };

  const handleSrsAction = async (type) => {
    const currentQueueIdx = queue[0];
    let newQueue = [...queue];
    newQueue.shift();
    const newHistory = { ...history, [type]: history[type] + 1 };
    setHistory(newHistory);
    if (type === 'again') {
      if (newQueue.length >= 1) newQueue.splice(1, 0, currentQueueIdx);
      else newQueue.push(currentQueueIdx);
    } else if (type === 'hard') {
      newQueue.splice(Math.floor(newQueue.length / 2), 0, currentQueueIdx);
    } else if (type === 'good') {
      newQueue.push(currentQueueIdx);
    }
    if (newQueue.length === 0) setIsFinished(true);
    else {
      setQueue(newQueue);
      setIsFlipped(false);
    }
    if (currentDeckId && user) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', currentDeckId), {
          queue: newQueue, history: newHistory
        });
      } catch (e) {}
    }
  };

  // 輔助函式：清理 AI 回傳的 Markdown 標籤並解析 JSON
  const safeJsonParse = (text) => {
    try {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error("JSON 解析失敗，請再試一次");
    }
  };

  const generateCardsWithAI = async () => {
    if (!inputText.trim()) return;
    setIsGeneratingCards(true);
    setGenError('');
    if (!isCanvasEnvironment && !apiKey) {
      setGenError('❌ 找不到金鑰！');
      setIsGeneratingCards(false);
      return;
    }
    try {
      const isEnglishMode = /[a-zA-Z]/.test(inputText);
      const prompt = isEnglishMode 
        ? `你是一位專業英文教師。請從 """${inputText}""" 萃取英文單字。務必只回傳一個 JSON 陣列，格式如下：[{"word": "...", "reading": "...", "meaning": "...", "derivatives": "...", "collocations": "...", "example_en": "...", "example_zh": "..."}]`
        : `你是一位專業日文教師。請從 """${inputText}""" 萃取日文單字。務必只回傳一個 JSON 陣列，格式如下：[{"word": "...", "reading": "...", "meaning": "...", "breakdown": "...", "example_jp": "...", "example_kana": "...", "example_zh": "..."}]`;

      // 修復：正式版與測試版環境採取一致的 v1 地址與最穩定呼叫方式
      const API_VERSION = isCanvasEnvironment ? "v1beta" : "v1";
      const MODEL_NAME = isCanvasEnvironment ? "gemini-2.5-flash-preview-09-2025" : "gemini-1.5-flash";
      
      const response = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
          // 移除 responseMimeType 以避免 v1 正式版報錯，改用 Prompt 強制約束
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || response.statusText);
      }
      
      const data = await response.json();
      const parsedData = safeJsonParse(data.candidates[0].content.parts[0].text);
      
      const newCards = parsedData.map(item => {
        if (!isEnglishMode) {
          return { word: item.word, info: `${item.reading} ${item.meaning} 💡 [字句分析] ${item.breakdown} 【例句】${item.example_jp}(${item.example_kana})${item.example_zh}` };
        } else {
          return { word: item.word, info: `${item.reading || ''} ${item.meaning} 💡 [變化] ${item.derivatives || ''} 💡 [搭配] ${item.collocations || ''} 【例句】${item.example_en}()${item.example_zh}` };
        }
      });

      setCards(newCards);
      setQueue(Array.from({ length: newCards.length }, (_, i) => i));
      setTotalInitial(newCards.length);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false);
      setIsFlipped(false);
    } catch (e) {
      setGenError(`❌ Google 系統錯誤：${e.message}`);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const saveAndShare = async () => {
    if (!user || cards.length === 0) return;
    setIsSaving(true);
    const deckId = crypto.randomUUID();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), {
        cards, queue, history, creator: user.uid, createdAt: new Date().toISOString()
      });
      const url = `${window.location.origin}${window.location.pathname}?deckId=${deckId}`;
      setShareUrl(url);
      setCurrentDeckId(deckId);
      window.history.pushState({}, '', `?deckId=${deckId}`);
    } catch (err) {} finally { setIsSaving(false); }
  };

  useEffect(() => {
    if (cards.length === 0 || isFinished) return;
    const loadImages = async () => {
      const card = cards[queue[0]];
      if (!card || imageUrls[card.word] || translatingRef.current.has(card.word)) return;
      translatingRef.current.add(card.word);
      setImageUrls(prev => ({ ...prev, [card.word]: `https://loremflickr.com/400/300/${encodeURIComponent(card.word)}` }));
    };
    loadImages();
  }, [queue, cards, isFinished, imageUrls]);

  useEffect(() => {
    if (queue.length > 0 && !isFinished && cards.length > 0 && isFlipped) speak(getSpeakableText(cards[queue[0]]));
  }, [isFlipped]);

  const getRating = () => {
    const total = history.again + history.hard + history.good + history.easy;
    if (total === 0) return { score: 0, text: "尚無資料", color: "text-slate-500", emoji: "🤔" };
    const score = Math.round(((history.easy * 100) + (history.good * 100) + (history.hard * 50)) / total);
    if (score >= 90) return { score, text: "優秀", color: "text-green-500", emoji: "🌟" };
    if (score >= 60) return { score, text: "及格", color: "text-blue-500", emoji: "👌" };
    return { score, text: "加油", color: "text-red-500", emoji: "💪" };
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center">
          <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-black mb-2">建立專屬字庫</h1>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGeneratingCards}
            placeholder="請直接輸入單字..."
            className="w-full h-32 p-4 mb-3 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
          />
          {genError && <div className="text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg text-xs font-bold mb-3 whitespace-pre-wrap text-left">{genError}</div>}
          <button
            onClick={generateCardsWithAI}
            disabled={isGeneratingCards || !inputText.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isGeneratingCards ? <Loader2 className="animate-spin" /> : <Star size={18} />}
            {isGeneratingCards ? 'AI 分析中...' : '✨ AI 生成單字卡'}
          </button>
          <div className="text-center text-slate-300 text-[10px] mt-6 font-bold uppercase tracking-widest">Vercel 終極修復版 v3.1</div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const rating = getRating();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-lg w-full text-center">
          <div className="text-6xl mb-4 animate-bounce">{rating.emoji}</div>
          <h1 className="text-2xl font-black">{rating.score} 分 - {rating.text}</h1>
          <button onClick={() => { setQueue(Array.from({ length: cards.length }, (_, i) => i)); setHistory({ again: 0, hard: 0, good: 0, easy: 0 }); setIsFinished(false); }} className="mt-8 w-full bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-black"><RefreshCcw size={20} />重新開始</button>
        </div>
      </div>
    );
  }

  const currentCard = cards[queue[0]];
  const progress = ((totalInitial - queue.length) / totalInitial) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans text-slate-800">
      <div className="w-full max-w-md mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border text-sm font-bold flex items-center gap-2">
            <Brain size={16} className="text-indigo-600" />
            {totalInitial - queue.length} / {totalInitial}
          </div>
          <button onClick={saveAndShare} disabled={isSaving} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md hover:bg-indigo-700 transition-all">
            {isSaving ? <Loader2 className="animate-spin" /> : (shareUrl ? '已儲存' : '儲存進度')}
          </button>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full transition-all duration-700" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="relative w-full max-w-md h-[70vh] min-h-[450px] cursor-pointer perspective-1000" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-8 border">
            <h2 className="text-[3rem] font-black text-slate-800 text-center leading-tight mb-8 break-words w-full">{currentCard.word}</h2>
            <button onClick={(e) => { e.stopPropagation(); speak(currentCard.word); }} className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-sm hover:bg-indigo-100 transition-all"><Volume2 size={32} /></button>
            <div className="absolute bottom-8 text-slate-400 text-xs font-bold tracking-widest animate-pulse">點擊卡片翻面</div>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[2rem] shadow-xl flex flex-col p-4 border overflow-hidden">
            <img src={imageUrls[currentCard.word]} className="w-full h-28 object-cover rounded-xl mb-3 shadow-inner bg-slate-100" alt="" onError={(e) => e.target.src = 'https://loremflickr.com/400/300/japan'} />
            <div className="flex-1 overflow-y-auto pr-1">
              {formatBackHeader(currentCard)}
              {currentCard.info.includes('【例句】') && <div className="bg-slate-50 p-2.5 rounded-xl border mt-2">{formatExampleText(currentCard.info.split('【例句】')[1])}</div>}
            </div>
            <div className="grid grid-cols-5 gap-1 mt-2 pt-2 border-t">
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('again'); }} className="flex flex-col items-center text-red-500 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><RefreshCcw size={16} /></div><span className="text-[9px] font-bold">Again</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('hard'); }} className="flex flex-col items-center text-orange-500 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"><Flame size={16} /></div><span className="text-[9px] font-bold">Hard</span></button>
              <button onClick={(e) => { e.stopPropagation(); speak(getSpeakableText(currentCard)); }} className="flex flex-col items-center -mt-2 hover:scale-110 transition-transform"><div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Volume2 size={20} /></div><span className="text-[9px] font-bold text-indigo-600">Listen</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('good'); }} className="flex flex-col items-center text-blue-500 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Star size={16} /></div><span className="text-[9px] font-bold">Good</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('easy'); }} className="flex flex-col items-center text-green-500 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><Zap size={16} /></div><span className="text-[9px] font-bold">Easy</span></button>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; }` }} />
    </div>
  );
};

export default App;