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
  Info
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

  // --- 初始化登入 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isCanvasEnvironment && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setAuthError('無法連線到資料庫');
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

  // --- 讀取分享進度 ---
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
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDeck();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // --- 智慧語音系統 (TTS) ---
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isEnglish = /[a-zA-Z]/.test(text);
    utterance.lang = isEnglish ? 'en-US' : 'ja-JP';
    utterance.rate = 0.85; 
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

  // --- 排版輔助 ---
  const formatExampleText = (exampleString) => {
    if (!exampleString) return null;
    const match = exampleString.match(/^(.*?)\((.*?)\)(.*)$/);
    if (match) {
      return (
        <div className="space-y-1">
          <div className="text-[15px] font-bold text-slate-800 leading-snug">{match[1].trim()}</div>
          {match[2].trim() && <div className="text-[12px] font-medium text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded inline-block">{match[2].trim()}</div>}
          {match[3].trim() && <div className="text-[13px] text-slate-600 italic mt-1 border-l-2 border-slate-200 pl-2">{match[3].trim()}</div>}
        </div>
      );
    }
    return <div className="text-[14px] text-slate-700">{exampleString}</div>;
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
      <div className="space-y-3">
        <div className="flex items-end gap-3 flex-wrap">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{card.word}</span>
          {reading && <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{reading}</span>}
        </div>
        <div className="text-lg text-slate-700 font-medium whitespace-pre-line leading-relaxed">{meaning}</div>
        {extraSections.map((sec, idx) => (
          <div key={idx} className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl text-[13px] text-amber-900 font-medium leading-relaxed shadow-sm">
            💡 {sec.replace(/\[.*?\]\s*/, '').trim()}
          </div>
        ))}
      </div>
    );
  };

  // --- ANKI SRS 邏輯 ---
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

  // --- 核心修復：穩定版 AI 生成 ---
  const generateCardsWithAI = async () => {
    if (!inputText.trim()) return;
    setIsGeneratingCards(true);
    setGenError('');
    
    if (!isCanvasEnvironment && !apiKey) {
      setGenError('❌ 找不到金鑰！請檢查 StackBlitz 同步狀態。');
      setIsGeneratingCards(false);
      return;
    }

    const isEnglishMode = /[a-zA-Z]/.test(inputText);
    const prompt = isEnglishMode 
      ? `你是一位專業英文教師。請分析文字 """${inputText}""" 萃取出所有重要單字，並回傳一個 JSON 陣列。
         陣列格式：[{"word": "單字", "reading": "音標", "meaning": "詞性與中文意思", "derivatives": "詞性變化", "collocations": "搭配詞", "example_en": "英文例句", "example_zh": "中文翻譯"}]
         注意：請只回傳 JSON，不要有其他文字。`
      : `你是一位專業日文教師。請分析文字 """${inputText}""" 萃取出所有重要單字，並回傳一個 JSON 陣列。
         陣列格式：[{"word": "單字", "reading": "平假名讀音", "meaning": "中文意思與詞性", "breakdown": "字句拆解與記憶法", "example_jp": "日文例句", "example_kana": "例句讀音", "example_zh": "中文翻譯"}]
         注意：請只回傳 JSON，不要有其他文字。`;

    const modelsToTry = isCanvasEnvironment 
      ? ["gemini-2.5-flash-preview-09-2025"] 
      : ["gemini-1.5-flash", "gemini-1.5-pro"];

    let success = false;
    let errorMsg = "";

    for (const model of modelsToTry) {
      try {
        // 使用 v1beta 搭配 Flash 通常最穩定，若報錯會自動切換下一個型號
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "引擎不認帳");
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(jsonText);

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
        success = true;
        break; 
      } catch (e) {
        errorMsg = e.message;
        continue;
      }
    }

    if (!success) setGenError(`❌ Google 系統連線失敗：${errorMsg}`);
    setIsGeneratingCards(false);
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

  const copyToClipboard = () => {
    const el = document.createElement('textarea');
    el.value = shareUrl || `${window.location.origin}${window.location.pathname}?deckId=${currentDeckId}`;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- 自動生圖預載 ---
  useEffect(() => {
    if (cards.length === 0 || isFinished) return;
    const card = cards[queue[0]];
    if (!card || imageUrls[card.word] || translatingRef.current.has(card.word)) return;
    translatingRef.current.add(card.word);
    setImageUrls(prev => ({ ...prev, [card.word]: `https://loremflickr.com/500/300/${encodeURIComponent(card.word)}` }));
  }, [queue, cards, isFinished, imageUrls]);

  // --- 朗讀連動 ---
  useEffect(() => {
    if (queue.length > 0 && !isFinished && cards.length > 0 && isFlipped) speak(getSpeakableText(cards[queue[0]]));
  }, [isFlipped]);

  const getRating = () => {
    const total = history.again + history.hard + history.good + history.easy;
    if (total === 0) return { score: 0, text: "尚無資料", color: "text-slate-500", emoji: "🤔" };
    const score = Math.round(((history.easy * 100) + (history.good * 100) + (history.hard * 50)) / total);
    if (score >= 90) return { score, text: "完美發揮", color: "text-green-500", emoji: "🌟" };
    if (score >= 60) return { score, text: "穩定成長", color: "text-blue-500", emoji: "👌" };
    return { score, text: "再接再厲", color: "text-red-500", emoji: "💪" };
  };

  // --- 畫面渲染 ---
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      <span className="font-bold text-slate-400 tracking-widest uppercase text-xs">Loading字庫中...</span>
    </div>
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Brain className="text-indigo-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">建立你的專屬字庫</h1>
          <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">貼上純單字，讓 AI 為你補齊解釋與意象化記憶法</p>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGeneratingCards}
            placeholder={`在此輸入單字...\n例如：\n車站\n食べる\nEfficiency`}
            className="w-full h-40 p-5 mb-4 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none font-medium resize-none text-slate-700 shadow-inner"
          />

          {genError && <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-2xl text-xs font-bold mb-5 whitespace-pre-wrap text-left shadow-sm flex items-start gap-2">
            <Info size={16} className="shrink-0" /> {genError}
          </div>}

          <button
            onClick={generateCardsWithAI}
            disabled={isGeneratingCards || !inputText.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isGeneratingCards ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />}
            {isGeneratingCards ? 'AI 正在全力分析中...' : '✨ AI 智慧生成完整單字卡'}
          </button>
          
          <div className="text-center text-slate-300 text-[11px] mt-10 font-black uppercase tracking-[0.2em]">Vercel 終極正式版 v4.0</div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const rating = getRating();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-slate-800">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center border border-slate-100">
          <div className="text-8xl mb-6 animate-bounce drop-shadow-lg">{rating.emoji}</div>
          <h1 className="text-3xl font-black mb-1">完成本日練習！</h1>
          <div className={`text-4xl font-black ${rating.color} mb-8`}>{rating.score} 分 - {rating.text}</div>
          
          <button 
            onClick={() => { setQueue(Array.from({ length: cards.length }, (_, i) => i)); setHistory({ again: 0, hard: 0, good: 0, easy: 0 }); setIsFinished(false); }} 
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl"
          >
            <RefreshCcw size={22} />
            重新開始這一輪
          </button>
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
          <div className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100 text-[15px] font-black flex items-center gap-2 text-slate-700">
            <Brain size={18} className="text-indigo-600" />
            {totalInitial - queue.length} <span className="text-slate-300 font-medium mx-1">/</span> {totalInitial}
          </div>
          <button 
            onClick={currentDeckId || shareUrl ? copyToClipboard : saveAndShare} 
            disabled={isSaving} 
            className={`px-5 py-2.5 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-2 ${copySuccess ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : (copySuccess ? <Check size={14} /> : <Share2 size={14} />)}
            {copySuccess ? '已複製網址' : (currentDeckId || shareUrl ? '複製同步連結' : '儲存至雲端')}
          </button>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner border border-slate-100">
          <div className="bg-indigo-500 h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div 
        className="relative w-full max-w-md h-[68vh] min-h-[500px] max-h-[650px] cursor-pointer perspective-1000 group" 
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* 正面 */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10 border border-slate-100">
            <h2 className="text-[3.5rem] font-black text-slate-900 text-center leading-[1.1] mb-12 break-words w-full drop-shadow-sm">{currentCard.word}</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); speak(currentCard.word); }} 
              className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner hover:bg-indigo-100 hover:scale-110 transition-all border-2 border-indigo-100/50"
            >
              <Volume2 size={40} />
            </button>
            <div className="absolute bottom-10 flex items-center gap-2 text-slate-300 text-[11px] font-black tracking-[0.3em] uppercase animate-pulse">
              點擊翻面 <ChevronRight size={14} />
            </div>
          </div>

          {/* 背面 */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[3rem] shadow-2xl flex flex-col p-6 border border-slate-100 overflow-hidden">
            <div className="w-full h-36 bg-slate-100 rounded-3xl mb-5 overflow-hidden shadow-inner border border-slate-50 shrink-0">
              <img 
                src={imageUrls[currentCard.word]} 
                className="w-full h-full object-cover transition-opacity duration-500 hover:scale-105 transition-transform" 
                alt="" 
                onError={(e) => e.target.src = 'https://loremflickr.com/500/300/japan'} 
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {formatBackHeader(currentCard)}
              {currentCard.info.includes('【例句】') && (
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mt-4 shadow-sm">
                  {formatExampleText(currentCard.info.split('【例句】')[1])}
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 mt-5 pt-5 border-t border-slate-100 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('again'); }} className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"><div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm"><RefreshCcw size={20} /></div><span className="text-[10px] font-black text-red-500/80 uppercase">Again</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('hard'); }} className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"><div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm"><Flame size={20} /></div><span className="text-[10px] font-black text-orange-500/80 uppercase">Hard</span></button>
              <button onClick={(e) => { e.stopPropagation(); speak(getSpeakableText(currentCard)); }} className="flex flex-col items-center gap-1 -mt-3 hover:scale-110 transition-transform group"><div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl border-4 border-white group-hover:bg-indigo-700 transition-colors"><Volume2 size={24} /></div><span className="text-[10px] font-black text-indigo-600 uppercase">Listen</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('good'); }} className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"><div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><Star size={20} /></div><span className="text-[10px] font-black text-blue-500/80 uppercase">Good</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleSrsAction('easy'); }} className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"><div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-sm"><Zap size={20} /></div><span className="text-[10px] font-black text-green-500/80 uppercase">Easy</span></button>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; } 
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } 
        .rotate-y-180 { transform: rotateY(180deg); } 
        .transform-style-3d { transform-style: preserve-3d; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      ` }} />
    </div>
  );
};

export default App;