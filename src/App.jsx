import React, { useState, useEffect } from 'react';
import { 
  Volume2, RefreshCcw, Brain, Zap, Star, Flame, Share2, Check, Loader2, AlertTriangle, ChevronRight, Clock, Home, Trophy, Lock, Trash2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// --- 1. Firebase 資料庫專用配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyD2dxrjW68kjR66RgeFdXl2o4jW2ooGwwU",
  authDomain: "killercards.firebaseapp.com",
  projectId: "killercards",
  storageBucket: "killercards.firebasestorage.app",
  messagingSenderId: "281065379733",
  appId: "1:281065379733:web:06fc2160b85fae7579c89c",
  measurementId: "G-PVFYPMRPH2"
};

// --- 2. 金鑰自動讀取機制 ---
const getEnvKey = () => {
  try {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    if (env?.VITE_GEMINI_API_KEY) return env.VITE_GEMINI_API_KEY;
  } catch(e) {}
  return "";
};

const getLocalKey = () => {
  try { return localStorage.getItem('my_gemini_key') || ""; } catch(e) { return ""; }
};

// 自動判斷環境
const isCanvas = typeof __firebase_config !== 'undefined';
const app = initializeApp(isCanvas ? JSON.parse(__firebase_config) : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : (firebaseConfig.projectId !== '請在此填入新的_projectId' ? firebaseConfig.projectId : 'kcvocabapp');

// 安全更新網址列
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
  } catch (e) {}
};

// --- 國小必備 300 單字庫 (依難易度分三級) ---
const vocabLow = [
  { word: "zero", meaning: "零" }, { word: "one", meaning: "一" }, { word: "two", meaning: "二" }, { word: "three", meaning: "三" },
  { word: "four", meaning: "四" }, { word: "five", meaning: "五" }, { word: "six", meaning: "六" }, { word: "seven", meaning: "七" },
  { word: "eight", meaning: "八" }, { word: "nine", meaning: "九" }, { word: "ten", meaning: "十" }, { word: "I", meaning: "我" },
  { word: "you", meaning: "你" }, { word: "he", meaning: "他" }, { word: "she", meaning: "她" }, { word: "it", meaning: "牠/它" },
  { word: "we", meaning: "我們" }, { word: "they", meaning: "他們" }, { word: "mother", meaning: "媽媽" }, { word: "father", meaning: "爸爸" },
  { word: "brother", meaning: "兄弟" }, { word: "sister", meaning: "姊妹" }, { word: "head", meaning: "頭" }, { word: "hair", meaning: "頭髮" },
  { word: "eye", meaning: "眼睛" }, { word: "nose", meaning: "鼻子" }, { word: "mouth", meaning: "嘴巴" }, { word: "ear", meaning: "耳朵" },
  { word: "hand", meaning: "手" }, { word: "leg", meaning: "腿" }, { word: "foot", meaning: "腳" }, { word: "dog", meaning: "狗" },
  { word: "cat", meaning: "貓" }, { word: "bird", meaning: "鳥" }, { word: "fish", meaning: "魚" }, { word: "pig", meaning: "豬" },
  { word: "lion", meaning: "獅子" }, { word: "tiger", meaning: "老虎" }, { word: "elephant", meaning: "大象" }, { word: "monkey", meaning: "猴子" }
];

const vocabMid = [
  { word: "teacher", meaning: "老師" }, { word: "student", meaning: "學生" }, { word: "doctor", meaning: "醫生" }, { word: "nurse", meaning: "護理師" },
  { word: "hat", meaning: "帽子" }, { word: "shirt", meaning: "襯衫" }, { word: "pants", meaning: "長褲" }, { word: "shoes", meaning: "鞋子" },
  { word: "pen", meaning: "原子筆" }, { word: "pencil", meaning: "鉛筆" }, { word: "eraser", meaning: "橡皮擦" }, { word: "ruler", meaning: "尺" },
  { word: "book", meaning: "書" }, { word: "bag", meaning: "袋子" }, { word: "desk", meaning: "書桌" }, { word: "chair", meaning: "椅子" },
  { word: "door", meaning: "門" }, { word: "window", meaning: "窗戶" }, { word: "computer", meaning: "電腦" }, { word: "phone", meaning: "手機" },
  { word: "water", meaning: "水" }, { word: "milk", meaning: "牛奶" }, { word: "juice", meaning: "果汁" }, { word: "apple", meaning: "蘋果" },
  { word: "banana", meaning: "香蕉" }, { word: "bread", meaning: "麵包" }, { word: "egg", meaning: "蛋" }, { word: "cake", meaning: "蛋糕" },
  { word: "home", meaning: "家" }, { word: "school", meaning: "學校" }, { word: "park", meaning: "公園" }, { word: "store", meaning: "商店" },
  { word: "car", meaning: "車" }, { word: "bus", meaning: "公車" }, { word: "train", meaning: "火車" }, { word: "bike", meaning: "腳踏車" }
];

const vocabHigh = [
  { word: "morning", meaning: "早上" }, { word: "afternoon", meaning: "下午" }, { word: "evening", meaning: "傍晚" }, { word: "night", meaning: "晚上" },
  { word: "today", meaning: "今天" }, { word: "run", meaning: "跑" }, { word: "walk", meaning: "走路" }, { word: "swim", meaning: "游泳" },
  { word: "jump", meaning: "跳" }, { word: "read", meaning: "閱讀" }, { word: "write", meaning: "寫" }, { word: "eat", meaning: "吃" },
  { word: "drink", meaning: "喝" }, { word: "look", meaning: "看" }, { word: "listen", meaning: "聽" }, { word: "say", meaning: "說" },
  { word: "good", meaning: "好的" }, { word: "bad", meaning: "壞的" }, { word: "big", meaning: "大的" }, { word: "small", meaning: "小的" },
  { word: "tall", meaning: "高的" }, { word: "short", meaning: "短的" }, { word: "fast", meaning: "快的" }, { word: "slow", meaning: "慢的" },
  { word: "happy", meaning: "開心的" }, { word: "sad", meaning: "傷心的" }, { word: "angry", meaning: "生氣的" }, { word: "tired", meaning: "累的" },
  { word: "hot", meaning: "熱的" }, { word: "cold", meaning: "冷的" }, { word: "in", meaning: "在...裡面" }, { word: "on", meaning: "在...上面" },
  { word: "under", meaning: "在...下面" }, { word: "what", meaning: "什麼" }, { word: "where", meaning: "哪裡" }, { word: "when", meaning: "何時" },
  { word: "who", meaning: "誰" }, { word: "why", meaning: "為什麼" }, { word: "how", meaning: "如何" }
];

const App = () => {
  const [activeApiKey, setActiveApiKey] = useState(() => isCanvas ? "" : (getEnvKey() || getLocalKey()));
  const [keyInput, setKeyInput] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);

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
  
  const [isSaving, setIsSaving] = useState(false);
  const [shareModal, setShareModal] = useState({ isOpen: false, url: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', message: '' });
  const [pwdModal, setPwdModal] = useState({ isOpen: false, value: '', error: '' });

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
        setError("❌ Firebase 連線失敗，請檢查網路或專案設定。");
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

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
          if (err.message.includes("permissions")) setError("❌ 資料庫權限不足！");
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
    if (c.info && c.info.includes('【例句】')) ex = c.info.split('【例句】')[1];
    else if (c.example) ex = c.example;
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
        const updatePromise = updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), { queue: nextQ, history: nextH });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000));
        await Promise.race([updatePromise, timeoutPromise]);
      } catch(err) {}
    }
  };

  const openConfirm = (type, message) => setConfirmDialog({ isOpen: true, type, message });
  const closeConfirm = () => setConfirmDialog({ isOpen: false, type: '', message: '' });

  const executeConfirm = () => {
    if (confirmDialog.type === 'home') {
      setCards([]); setQueue([]); setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false); setIsFlipped(false); setDeckId(null); setInput('');
      safePushState(window.location.pathname);
    } else if (confirmDialog.type === 'finish') {
      setIsFinished(true);
    }
    closeConfirm();
  };

  const loadPresetCards = (vocabList) => {
    const newCards = vocabList.map(item => ({
      word: item.word,
      reading: '',
      meaning: item.meaning,
      breakdown: '',
      example: '',
      example_kana: '',
      example_zh: '',
      info: `${item.meaning} 💡 [單字分類] 教育部國小必備 300 單字表`
    }));
    
    setCards(newCards);
    setQueue(Array.from({length: newCards.length}, (_, i) => i));
    setTotal(newCards.length);
    setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
    setIsFinished(false); 
    setIsFlipped(false);
  };

  // 💡 v11.8 核心：金鑰即時檢測系統
  const validateAndSaveKey = async () => {
    const tk = keyInput.trim();
    if (!tk) return;

    if (tk === firebaseConfig.apiKey) {
      setError('❌ 致命錯誤：這把是「Firebase 資料庫」的鑰匙！您必須去 Google AI Studio 申請 AI 專屬鑰匙。');
      return;
    }

    setIsValidatingKey(true);
    setError('');

    try {
      // 嘗試去敲 Google AI 的大門，列出可用模型
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${tk}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) {
          setError("❌ 錯誤：金鑰格式無效 (API_KEY_INVALID)。請檢查是否複製完整，或是多複製了空白鍵。");
        } else if (res.status === 403) {
          setError("❌ 錯誤：這把金鑰缺乏 AI 權限 (PERMISSION_DENIED)。請確保您是從「Google AI Studio」申請的！");
        } else {
          setError(`❌ 錯誤碼 ${res.status}：${data.error?.message}`);
        }
        setIsValidatingKey(false);
        return;
      }

      // 如果成功列出模型，代表這把金鑰 100% 沒問題！
      localStorage.setItem('my_gemini_key', tk);
      setActiveApiKey(tk);
    } catch (e) {
      setError("❌ 網路連線異常，無法驗證金鑰，請檢查網路狀態。");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const generate = async () => {
    if (!input.trim() || genLoading) return;
    const reqKey = isCanvas ? "" : activeApiKey;
    if (!reqKey && !isCanvas) {
      setError('❌ 找不到 API 金鑰！請至 Vercel 設定 VITE_GEMINI_API_KEY 環境變數。');
      return;
    }

    setGenLoading(true); setError('');
    const isEn = /[a-zA-Z]/.test(input);
    
    const prompt = isEn 
      ? `請分析以下文字：\n"""${input}"""\n這是一份「英文學習清單」。請提取出英文單字。\n⚠️極度重要：如果文字中混雜了單獨的「中文詞彙」（代表使用者不知道那個字的英文怎麼拼），請務必自動將該中文「翻譯成英文單字」，並作為一張新的英文單字卡加入清單中！\n回傳 JSON 陣列：[{"word": "英文單字", "reading": "音標", "meaning": "詞性與意思", "breakdown": "字根拆解與意象說明 (請用生動通用的比喻幫助記憶)", "example": "英文例句", "example_kana": "", "example_zh": "翻譯"}]。請只回傳 JSON。`
      : `請分析以下文字：\n"""${input}"""\n這是一份「日文學習清單」。\n⚠️極度重要：即使使用者輸入的全部都是「純中文」，你也必須把它當作是想要學習的目標，自動將這些中文「翻譯成對應的日文單字」，並為其建立日文單字卡！\n回傳 JSON 陣列：[{"word": "日文單字(若來源為中文請翻譯成日文)", "reading": "讀音", "meaning": "詞性與意思 (若是動詞，務必明確標註為：第一/二/三類動詞)", "breakdown": "字句拆解(例如:根強い=根+強い)與意象說明 (請用生動通用的比喻幫助記憶)", "example": "例句", "example_kana": "例句平假名", "example_zh": "翻譯"}]。請只回傳 JSON。`;

    const targetModels = isCanvas 
      ? ["gemini-2.5-flash-preview-09-2025"] 
      : ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };

    let success = false;
    let lastError = "";
    let isKeyInvalid = false;

    for (const model of targetModels) {
        if (success || isKeyInvalid) break;
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${reqKey}`;
        const delays = [1000, 2000, 4000];

        for (let attempt = 0; attempt <= 3; attempt++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    const errMsg = data.error?.message || "未知錯誤";
                    
                    if (res.status === 404) {
                        lastError = `模型 ${model} 不可用...`;
                        if (model === targetModels[targetModels.length - 1]) {
                            lastError = `您輸入的金鑰權限異常，找不到任何可用模型！\n(可能您把金鑰寫在 Vercel 環境變數了，請確認那把也是從 AI Studio 申請的喔！)`;
                        }
                        break; 
                    }
                    
                    if (res.status === 429 || res.status === 503) {
                        if (attempt < 3) {
                            await new Promise(r => setTimeout(r, delays[attempt]));
                            continue; 
                        } else {
                            lastError = "Google AI 伺服器目前大塞車，請稍等 1 分鐘後再試一次！";
                            break;
                        }
                    } 
                    
                    if (res.status === 400 || res.status === 403) {
                        setActiveApiKey(''); 
                        try { localStorage.removeItem('my_gemini_key'); } catch(e){}
                        lastError = `您的 AI 金鑰已被 Google 停權或無效！請重新輸入。`;
                        isKeyInvalid = true;
                        break; 
                    }

                    lastError = `發生錯誤：${errMsg}`;
                    break;
                }
                
                const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
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
                lastError = "伺服器處理失敗，正在嘗試修復中...";
                if (attempt < 3) {
                    await new Promise(r => setTimeout(r, delays[attempt]));
                }
            }
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

  // --- 防護：金鑰檢測輸入畫面 ---
  if (!isCanvas && !activeApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-inner">
             <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-4">系統安全鎖</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-[13px] font-bold border border-red-100 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <p className="text-[13px] text-slate-500 mb-6 font-medium text-left leading-relaxed">
            請前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-500 underline font-bold">Google AI Studio</a> 點擊「Create API key」申請一把全新的金鑰。<br/><br/>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">系統會自動驗證金鑰是否有效，通過後即可使用！</span>
          </p>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            disabled={isValidatingKey}
            placeholder="請貼上 AIzaSy 開頭的 AI 金鑰..."
            className="w-full p-4 mb-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium transition-colors disabled:opacity-50"
          />
          <button
            onClick={validateAndSaveKey}
            disabled={!keyInput.trim() || isValidatingKey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
          >
            {isValidatingKey ? <Loader2 size={18} className="animate-spin" /> : null}
            {isValidatingKey ? '正在連線驗證中...' : '驗證金鑰並進入 App'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      
      {pwdModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">工程師權限驗證</h3>
            <p className="text-xs text-slate-500 mb-6">請輸入管理者密碼以重置金鑰</p>
            
            <input 
              type="password" 
              placeholder="請輸入密碼..."
              value={pwdModal.value}
              onChange={e => setPwdModal({ ...pwdModal, value: e.target.value, error: '' })}
              className="w-full p-3 mb-2 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[0.3em] font-bold outline-none focus:border-indigo-500 transition-colors"
              maxLength={10}
            />
            
            {pwdModal.error && <p className="text-red-500 text-xs font-bold mb-2 animate-pulse">{pwdModal.error}</p>}
            
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPwdModal({ isOpen: false, value: '', error: '' })} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">取消</button>
              <button onClick={() => {
                if (pwdModal.value === '564335') {
                  setActiveApiKey('');
                  try { localStorage.removeItem('my_gemini_key'); } catch(e){}
                  setPwdModal({ isOpen: false, value: '', error: '' });
                } else {
                  setPwdModal({ ...pwdModal, error: '密碼錯誤，拒絕存取！' });
                }
              }} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md">驗證解鎖</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
        <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
        
        <h1 className="text-2xl font-black mb-6 text-slate-800">Killer Cards</h1>
        
        <div className="bg-indigo-50/50 p-4 rounded-2xl mb-5 border border-indigo-100">
          <div className="text-[13px] font-black text-indigo-800 mb-3 text-left flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            免輸入！點擊直接開始練習
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => loadPresetCards(vocabLow)} className="bg-white hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-2 rounded-xl text-[13px] transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1.5 active:scale-95">
              <span className="text-2xl drop-shadow-sm">👶</span>
              <span>國小(低)</span>
            </button>
            <button onClick={() => loadPresetCards(vocabMid)} className="bg-white hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-2 rounded-xl text-[13px] transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1.5 active:scale-95">
              <span className="text-2xl drop-shadow-sm">🧒</span>
              <span>國小(中)</span>
            </button>
            <button onClick={() => loadPresetCards(vocabHigh)} className="bg-white hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-2 rounded-xl text-[13px] transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1.5 active:scale-95">
              <span className="text-2xl drop-shadow-sm">👦</span>
              <span>國小(高)</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold tracking-wider">或輸入自訂單字</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="貼上想背的單字..." className="w-full h-32 p-5 mb-4 bg-slate-50 border-2 rounded-3xl outline-none focus:border-indigo-500 font-medium resize-none shadow-inner" />
        
        {error && (
          <div className={`p-4 rounded-2xl text-[12px] font-bold mb-4 text-left flex gap-2 leading-relaxed whitespace-pre-wrap ${error.includes('連線失敗') || error.includes('發生錯誤') || error.includes('致命錯誤') || error.includes('無效') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {error.includes('請求太快') ? <Clock size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
            {error}
          </div>
        )}

        <button onClick={generate} disabled={genLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {genLoading ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />} {genLoading ? '請求中...' : 'AI 智慧生成單字卡'}
        </button>
        
        <div className="mt-8 text-slate-300 text-[10px] font-black tracking-widest flex items-center justify-between">
          <span>v11.8 終極金鑰檢測版 byKC</span>
          {!isCanvas && (
             <button onClick={() => setPwdModal({ isOpen: true, value: '', error: '' })} className="hover:text-indigo-400 transition-colors flex items-center gap-1">
               <Trash2 size={10} /> 刪除本地舊鑰匙
             </button>
          )}
        </div>
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
      
      {/* 分享連結彈窗 */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
              <Share2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">進度已儲存！</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">請複製下方專屬網址，傳給朋友或用手機打開就能繼續背單字囉：</p>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 flex items-center gap-2">
              <input type="text" readOnly value={shareModal.url} className="w-full bg-transparent text-sm text-slate-600 font-medium outline-none" />
            </div>

            <button onClick={() => {
                try {
                   navigator.clipboard.writeText(shareModal.url);
                } catch(e){}
                setShareModal({ isOpen: false, url: '' });
            }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-md flex justify-center items-center gap-2">
              <Check size={18} /> 複製並關閉
            </button>
          </div>
        </div>
      )}

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
              setError("❌ 尚未成功連線至資料庫，請檢查上方是否有紅色的連線錯誤提示！");
              setTimeout(() => setError(""), 4000);
              return;
            }
            if (isSaving) return;
            setIsSaving(true);
            setError("");
            
            try {
              let shareId = deckId;
              if (!shareId) {
                shareId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
                  ? crypto.randomUUID() 
                  : 'deck-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
                
                const savePromise = setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', shareId), { cards, queue, history, creator: user.uid, createdAt: new Date().toISOString() });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 8000));
                
                await Promise.race([savePromise, timeoutPromise]);
                
                setDeckId(shareId); 
                safePushState(`?deckId=${shareId}`);
              }
              const shareUrl = `${window.location.origin}${window.location.pathname}?deckId=${shareId}`;
              
              try {
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(shareUrl);
                } else {
                  const el = document.createElement('textarea'); el.value = shareUrl; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
                }
              } catch (copyErr) {
                console.warn("剪貼簿自動複製被阻擋");
              }

              setCopyOk(true); 
              setTimeout(() => setCopyOk(false), 2000);
              setShareModal({ isOpen: true, url: shareUrl });

            } catch (err) {
              if (err.message === "TIMEOUT") {
                setError("❌ 連線遭阻擋！請檢查網路或專案 ID 是否正確。");
              } else if (err.message.includes("permissions")) {
                setError("❌ 資料庫權限不足！請確認 Firebase Rules 規則。");
              } else {
                setError("❌ 儲存失敗：" + err.message);
              }
              setTimeout(() => setError(""), 5000);
            } finally {
              setIsSaving(false);
            }
          }} disabled={isSaving} className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md text-white transition-all shrink-0 ${copyOk ? 'bg-green-500 scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}`} title="儲存與分享">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : copyOk ? <Check size={16} /> : <Share2 size={16} />}
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