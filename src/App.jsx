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
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

// --- Firebase 雲端環境設定 ---
// 你的專屬正式版金鑰 (Vercel 發布用)
const myFirebaseConfig = {
  apiKey: 'AIzaSyCfnMao6o2QCNY4ZuV40XATZv-VrZSK_Rg',
  authDomain: 'kcvocabapp.firebaseapp.com',
  projectId: 'kcvocabapp',
  storageBucket: 'kcvocabapp.firebasestorage.app',
  messagingSenderId: '835597766849',
  appId: '1:835597766849:web:962ccd9b694c7e08250440',
  measurementId: 'G-C1SDRQR6MS',
};

// 自動判斷環境：如果在 AI 測試環境，使用內部金鑰；如果發布到 Vercel，自動切換成你的金鑰
const isCanvasEnvironment = typeof __firebase_config !== 'undefined';
const activeConfig = isCanvasEnvironment
  ? JSON.parse(__firebase_config)
  : myFirebaseConfig;

const app = initializeApp(activeConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kcvocabapp';

const App = () => {
  // --- 狀態管理 (State) ---
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
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
        if (
          isCanvasEnvironment &&
          typeof __initial_auth_token !== 'undefined' &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('登入失敗', err);
        setAuthError('無法連線到資料庫，請確認您的網路狀態或 Firebase 設定。');
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
          const docRef = doc(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'decks',
            deckId
          );
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCards(data.cards);
            setTotalInitial(data.cards.length);

            if (data.queue) {
              setQueue(data.queue);
              setHistory(
                data.history || { again: 0, hard: 0, good: 0, easy: 0 }
              );
              if (data.queue.length === 0) setIsFinished(true);
            } else {
              const initialQueue = Array.from(
                { length: data.cards.length },
                (_, i) => i
              );
              setQueue(initialQueue);
            }
          }
        } catch (err) {
          console.error('讀取單字庫失敗', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDeck();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // --- 2. 智慧語音系統 (TTS) ---
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // 判斷：包含英文字母就是英文發音，否則一律用日文發音（包含純漢字）
    const isEnglish = /[a-zA-Z]/.test(text);
    utterance.lang = isEnglish ? 'en-US' : 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const getSpeakableText = (card) => {
    if (!card) return '';
    let textToSpeak = card.word;

    if (card.info && card.info.includes('【例句】')) {
      const examplePart = card.info.split('【例句】')[1];
      if (examplePart) {
        const sentence = examplePart.split('(')[0].trim();
        textToSpeak += '、' + sentence;
      }
    }
    return textToSpeak;
  };

  // --- 3. 視覺排版格式化 ---
  const formatExampleText = (exampleString) => {
    if (!exampleString) return null;
    const match = exampleString.match(/^(.*?)\((.*?)\)(.*)$/);
    if (match) {
      return (
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-slate-800 leading-tight tracking-wide">
            {match[1].trim()}
          </div>
          {match[2].trim() && (
            <div className="text-[11px] font-medium text-indigo-500 leading-tight">
              {match[2].trim()}
            </div>
          )}
          {match[3].trim() && (
            <div className="text-xs text-slate-600 leading-tight">
              {match[3].trim()}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="text-[13px] text-slate-700 leading-tight">
        {exampleString}
      </div>
    );
  };

  const formatBackHeader = (card) => {
    if (!card.info) return null;
    const mainPart = card.info.split('【例句】')[0].trim();

    const parts = mainPart.split('💡').map((p) => p.trim());
    const headerText = parts[0];
    const extraSections = parts.slice(1);

    const firstSpaceIdx = headerText.indexOf(' ');
    let reading = '';
    let meaning = headerText;

    if (firstSpaceIdx !== -1) {
      reading = headerText.substring(0, firstSpaceIdx).trim();
      meaning = headerText.substring(firstSpaceIdx).trim();
    }

    return (
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 leading-tight">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-black text-indigo-900 tracking-wide">
            {card.word}
          </span>
          {reading && (
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-md">
              {reading}
            </span>
          )}
        </div>
        <div className="text-slate-700 text-sm mb-1.5 whitespace-pre-line leading-snug">
          {meaning}
        </div>
        {extraSections.map((sec, idx) => {
          const cleanSec = sec.replace(/\[.*?\]\s*/, '').trim();
          return (
            <div
              key={idx}
              className="mt-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100/50 leading-snug font-medium shadow-sm whitespace-pre-line"
            >
              💡 {cleanSec}
            </div>
          );
        })}
      </div>
    );
  };

  // --- 4. ANKI 演算法邏輯 ---
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
      const mid = Math.floor(newQueue.length / 2);
      newQueue.splice(mid, 0, currentQueueIdx);
    } else if (type === 'good') {
      newQueue.push(currentQueueIdx);
    }

    if (newQueue.length === 0) {
      setIsFinished(true);
    } else {
      setQueue(newQueue);
      setIsFlipped(false);
    }

    if (currentDeckId && user) {
      try {
        await updateDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'decks', currentDeckId),
          {
            queue: newQueue,
            history: newHistory,
          }
        );
      } catch (e) {
        console.error('自動存檔失敗', e);
      }
    }
  };

  // --- 5. CSV 解析器 ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter((row) => row.trim());
      const parsedCards = rows
        .map((row) => {
          const parts = row.match(/(".*?"|[^,]+)/g) || [];
          const word = (parts[0] || '').replace(/"/g, '').trim();
          const info = (parts[1] || '').replace(/"/g, '').trim();
          return { word, info };
        })
        .filter((c) => c.word);

      setCards(parsedCards);
      setQueue(Array.from({ length: parsedCards.length }, (_, i) => i));
      setTotalInitial(parsedCards.length);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false);
      setIsFlipped(false);
    };
    reader.readAsText(file);
  };

  const handleTextSubmit = () => {
    if (!inputText.trim()) return;
    setGenError('');
    const rows = inputText.split('\n').filter((row) => row.trim());
    const parsedCards = rows
      .map((row) => {
        let parts = [];
        if (row.includes(',') || row.includes('，')) {
          parts = row.split(/[,，]/);
        } else if (row.includes('\t')) {
          parts = row.split('\t');
        } else {
          const firstSpace = row.search(/\s/);
          if (firstSpace !== -1) {
            parts = [
              row.substring(0, firstSpace),
              row.substring(firstSpace + 1),
            ];
          } else {
            parts = [row, ''];
          }
        }
        const word = parts[0].trim().replace(/"/g, '');
        const info = parts.slice(1).join(', ').trim().replace(/"/g, '');
        return { word, info };
      })
      .filter((c) => c.word);

    if (parsedCards.length > 0) {
      setCards(parsedCards);
      setQueue(Array.from({ length: parsedCards.length }, (_, i) => i));
      setTotalInitial(parsedCards.length);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false);
      setIsFlipped(false);
    }
  };

  // --- 6. AI 智慧生成單字卡內容 ---
  const generateCardsWithAI = async () => {
    if (!inputText.trim()) return;
    setIsGeneratingCards(true);
    setGenError('');

    try {
      const apiKey = '';

      const isEnglishMode = /[a-zA-Z]/.test(inputText);
      const isJapaneseMode = !isEnglishMode;

      let prompt = '';
      if (isJapaneseMode) {
        prompt = `
          你是一位專業的日文教師。請從以下使用者輸入的文字中，自動萃取出「所有」具備學習價值的日文單字（請聰明地忽略題號或雜訊）。
          使用者輸入："""${inputText}"""
          請嚴格依照 JSON 陣列格式回傳：
          - word: 日文單字
          - reading: 平假名讀音
          - meaning: 中文意思與詞性/動詞分類
          - breakdown: 務必包含字根拆解與意象化記憶說明
          - example_jp: 日文例句
          - example_kana: 例句的平假名讀音
          - example_zh: 例句的中文翻譯
        `;
      } else {
        prompt = `
          你是一位專業的英文教師。請從以下使用者輸入的文字中，自動萃取出「所有」具備學習價值的英文單字（請聰明地忽略題號或雜訊）。
          使用者輸入："""${inputText}"""
          請嚴格依照 JSON 陣列格式回傳：
          - word: 英文單字
          - reading: 音標 (例如 /əˈraɪv/)，若無請留空
          - meaning: 詞性與中文意思 (例如 "(v.) 到達、抵達")
          - derivatives: 詞性變化 (例如 "arrival (n.) 到達、抵達")，若無請留空，多個請用 \\n 換行
          - collocations: 搭配詞 (例如 "arrive at the airport 到達機場\\narrive in London 到達倫敦")，若無請留空，多個請用 \\n 換行
          - example_en: 英文例句
          - example_zh: 例句的中文翻譯
        `;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!response.ok) throw new Error('API 回應錯誤');

      const data = await response.json();
      let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

      jsonText = jsonText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const parsedData = JSON.parse(jsonText);

      const newCards = parsedData.map((item) => {
        if (isJapaneseMode) {
          return {
            word: item.word,
            info: `${item.reading} ${item.meaning} 💡 [字句分析] ${item.breakdown} 【例句】${item.example_jp}(${item.example_kana})${item.example_zh}`,
          };
        } else {
          let infoStr = `${item.reading ? item.reading + ' ' : ''}${
            item.meaning
          }`;
          if (item.derivatives)
            infoStr += ` 💡 [詞性變化]\n${item.derivatives}`;
          if (item.collocations)
            infoStr += ` 💡 [搭配詞]\n${item.collocations}`;
          infoStr += ` 【例句】${item.example_en}()${item.example_zh}`;

          return {
            word: item.word,
            info: infoStr.trim(),
          };
        }
      });

      setCards(newCards);
      setQueue(Array.from({ length: newCards.length }, (_, i) => i));
      setTotalInitial(newCards.length);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false);
      setIsFlipped(false);
    } catch (e) {
      console.error('AI 處理失敗', e);
      setGenError('AI 生成失敗，請檢查格式或稍後再試。');
    } finally {
      setIsGeneratingCards(false);
    }
  };

  // --- 7. Save & Share ---
  const saveAndShare = async () => {
    if (!user || cards.length === 0) return;
    setIsSaving(true);
    const deckId = crypto.randomUUID();
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId),
        {
          cards,
          queue,
          history,
          creator: user.uid,
          createdAt: new Date().toISOString(),
        }
      );
      const url = `${window.location.origin}${window.location.pathname}?deckId=${deckId}`;
      setShareUrl(url);
      setCurrentDeckId(deckId);
      window.history.pushState({}, '', `?deckId=${deckId}`);
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    const el = document.createElement('textarea');
    el.value = shareUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- 8. AI 意象圖預載 ---
  useEffect(() => {
    if (cards.length === 0 || isFinished) return;

    const loadImages = async () => {
      const nextCards = queue.slice(0, 3).map((idx) => cards[idx]);
      for (const card of nextCards) {
        if (
          !card ||
          imageUrls[card.word] ||
          translatingRef.current.has(card.word)
        )
          continue;

        translatingRef.current.add(card.word);
        const hint = card.info
          ? card.info.split('【例句】')[0].replace(/[()]/g, ' ').trim()
          : '';
        const isEnglish = /[a-zA-Z]/.test(card.word);

        try {
          const apiKey = '';

          const translationPrompt = isEnglish
            ? `Extract a highly visual, simple English phrase for generating a stock photo (max 5 words) representing the concept: ${card.word}. Return ONLY the English text.`
            : `Translate this Japanese/Chinese vocabulary meaning into a highly visual, simple English phrase for generating a stock photo (max 5 words). Return ONLY the English text. Vocabulary: ${card.word}, Meaning: ${hint}`;

          const textRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: translationPrompt }] }],
              }),
            }
          );

          let enText = hint;
          if (textRes.ok) {
            const data = await textRes.json();
            const text =
              data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) enText = text;
          }

          const imgRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: {
                  prompt: `A clear, high quality stock photo representing the concept: ${enText}. Realistic, professional lighting, clean background, no text.`,
                },
                parameters: { sampleCount: 1 },
              }),
            }
          );

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (
              imgData.predictions &&
              imgData.predictions[0] &&
              imgData.predictions[0].bytesBase64Encoded
            ) {
              const base64Url = `data:image/png;base64,${imgData.predictions[0].bytesBase64Encoded}`;
              setImageUrls((prev) => ({ ...prev, [card.word]: base64Url }));
              continue;
            }
          }
          setImageUrls((prev) => ({
            ...prev,
            [card.word]: `https://loremflickr.com/400/300/${encodeURIComponent(
              enText
            )}`,
          }));
        } catch (e) {
          setImageUrls((prev) => ({
            ...prev,
            [card.word]: `https://loremflickr.com/400/300/japan`,
          }));
        }
      }
    };

    loadImages();
  }, [queue, cards, isFinished, imageUrls]);

  // --- 9. 翻面自動朗讀與快捷鍵 ---
  useEffect(() => {
    if (queue.length > 0 && !isFinished && cards.length > 0) {
      if (isFlipped) speak(getSpeakableText(cards[queue[0]]));
    }
  }, [queue, isFlipped, isFinished, cards]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && cards.length > 0 && !isFinished) {
        if (!isFlipped) setIsFlipped(true);
        else speak(getSpeakableText(cards[queue[0]]));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, cards, queue, isFinished]);

  // --- 10. 評分系統邏輯 ---
  const getRating = () => {
    const total = history.again + history.hard + history.good + history.easy;
    if (total === 0)
      return {
        score: 0,
        text: '尚無資料',
        color: 'text-slate-500',
        emoji: '🤔',
      };

    const score = Math.round(
      (history.easy * 100 + history.good * 100 + history.hard * 50) / total
    );

    if (score === 100)
      return { score, text: '完美全對', color: 'text-yellow-500', emoji: '🏆' };
    if (score >= 90)
      return { score, text: '優秀九成', color: 'text-green-500', emoji: '🌟' };
    if (score >= 80)
      return { score, text: '穩健八成', color: 'text-blue-500', emoji: '👍' };
    if (score >= 60)
      return { score, text: '及格', color: 'text-orange-500', emoji: '👌' };
    return { score, text: '不及格', color: 'text-red-500', emoji: '💪' };
  };

  // --- Views ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">載入中...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Brain className="text-indigo-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">
            建立你的專屬字庫
          </h1>
          <p className="text-slate-500 mb-6 text-sm font-medium">
            貼上純日文單字，讓 AI 為你自動補齊完整解釋與例句
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold rounded-xl text-left shadow-sm">
              ⚠️ 系統提示：{authError}
            </div>
          )}

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGeneratingCards}
            placeholder={`直接貼上純單字即可：\n\n会社員\n食べる\n根強い\narrive`}
            className="w-full h-32 p-4 mb-3 text-[15px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all placeholder:text-slate-400 font-medium disabled:opacity-50"
          />

          {genError && (
            <p className="text-red-500 text-xs font-bold mb-3">{genError}</p>
          )}

          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={generateCardsWithAI}
              disabled={isGeneratingCards || !inputText.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isGeneratingCards ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Star size={18} className="text-yellow-300" />
              )}
              {isGeneratingCards
                ? 'AI 正在分析建立中...'
                : '✨ AI 自動生成完整單字卡'}
            </button>

            <button
              onClick={handleTextSubmit}
              disabled={isGeneratingCards || !inputText.trim()}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              直接匯入 (我已排版好)
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">
              或使用檔案
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <label className="cursor-pointer bg-white border-2 border-slate-100 text-slate-600 font-bold py-3.5 px-8 rounded-xl hover:bg-slate-50 hover:border-indigo-100 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
            <Upload size={18} />
            上傳 CSV 檔案
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const rating = getRating();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-lg w-full text-center border border-slate-100">
          <div className="text-6xl mb-4 animate-bounce drop-shadow-md">
            {rating.emoji}
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            完成本日練習！
          </h1>
          <div className={`text-2xl font-black ${rating.color} mb-2`}>
            {rating.score} 分 - {rating.text}
          </div>
          <p className="text-slate-500 font-medium mb-8">
            持之以恆，語言就是你的肌肉記憶。
          </p>

          <div className="grid grid-cols-4 gap-2 my-8">
            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex flex-col items-center justify-center">
              <p className="text-red-600 font-black text-xl mb-1">
                {history.again}
              </p>
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
                Again
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex flex-col items-center justify-center">
              <p className="text-orange-600 font-black text-xl mb-1">
                {history.hard}
              </p>
              <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">
                Hard
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex flex-col items-center justify-center">
              <p className="text-blue-600 font-black text-xl mb-1">
                {history.good}
              </p>
              <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">
                Good
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
              <p className="text-green-600 font-black text-xl mb-1">
                {history.easy}
              </p>
              <p className="text-green-500 text-[10px] font-bold uppercase tracking-widest">
                Easy
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              const resetQueue = Array.from(
                { length: cards.length },
                (_, i) => i
              );
              const resetHistory = { again: 0, hard: 0, good: 0, easy: 0 };
              setQueue(resetQueue);
              setHistory(resetHistory);
              setIsFinished(false);
              setIsFlipped(false);

              if (currentDeckId && user) {
                try {
                  await updateDoc(
                    doc(
                      db,
                      'artifacts',
                      appId,
                      'public',
                      'data',
                      'decks',
                      currentDeckId
                    ),
                    {
                      queue: resetQueue,
                      history: resetHistory,
                    }
                  );
                } catch (e) {}
              }
            }}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCcw size={20} />
            重新開始這一輪
          </button>
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
          <div className="flex items-center gap-2 text-slate-700 font-black text-lg bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">
            <Brain size={18} className="text-indigo-600" />
            <span>
              {totalInitial - queue.length}{' '}
              <span className="text-slate-400 text-sm font-medium">
                / {totalInitial}
              </span>
            </span>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button
              onClick={() => setShowRatingModal(true)}
              className="flex items-center gap-1 text-[13px] text-amber-600 hover:text-amber-700 transition-colors font-bold"
            >
              📊 評分
            </button>
          </div>

          {shareUrl || currentDeckId ? (
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                copySuccess
                  ? 'bg-green-500 text-white shadow-green-200'
                  : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-indigo-100'
              }`}
            >
              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
              {copySuccess ? '已複製連結' : '複製進度連結'}
            </button>
          ) : (
            <button
              onClick={saveAndShare}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 border border-transparent text-white rounded-full text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} />
              )}
              儲存並產生連結
            </button>
          )}
        </div>

        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
          <div
            className="bg-indigo-500 h-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        className="relative w-full max-w-md h-[70vh] min-h-[450px] max-h-[600px] cursor-pointer perspective-1000 group"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div
          className={`relative w-full h-full transition-all duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center p-8 border border-slate-100">
            <div className="flex flex-col items-center gap-8">
              <h2 className="text-[3rem] font-black text-slate-800 text-center leading-tight tracking-wide drop-shadow-sm">
                {currentCard.word}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentCard.word);
                }}
                className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm"
              >
                <Volume2 size={32} />
              </button>
            </div>
            <div className="absolute bottom-8 text-slate-400 text-sm font-bold tracking-widest animate-pulse">
              [ 點擊卡片 或 按 Enter 翻面 ]
            </div>
          </div>

          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col p-4 sm:p-5 overflow-hidden border border-slate-100">
            <div className="w-full h-[100px] sm:h-28 bg-slate-100 rounded-xl mb-3 overflow-hidden relative flex items-center justify-center shadow-inner shrink-0">
              {imageUrls[currentCard.word] ? (
                <img
                  src={imageUrls[currentCard.word]}
                  className="w-full h-full object-cover z-10 relative transition-opacity duration-500"
                  alt="AI生成的意象圖"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://loremflickr.com/400/300/japan`;
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-0 bg-slate-50">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400">
                    Generating...
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {formatBackHeader(currentCard)}

              {currentCard.info.includes('【例句】') && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                  {formatExampleText(currentCard.info.split('【例句】')[1])}
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSrsAction('again');
                }}
                className="flex flex-col items-center gap-1.5 p-1 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl transition-all"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm bg-red-50 text-red-600 border border-red-100">
                  <RefreshCcw size={18} />
                </div>
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-red-500">
                  Again
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSrsAction('hard');
                }}
                className="flex flex-col items-center gap-1.5 p-1 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl transition-all"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm bg-orange-50 text-orange-600 border border-orange-100">
                  <Flame size={18} />
                </div>
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-orange-500">
                  Hard
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(getSpeakableText(currentCard));
                }}
                className="flex flex-col items-center justify-start gap-1 p-1 hover:scale-105 active:scale-95 transition-all group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md bg-indigo-600 text-white border-2 border-indigo-100 transform -translate-y-2 group-hover:bg-indigo-700">
                  <Volume2 size={22} className="sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-600 transform -translate-y-1">
                  Listen
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSrsAction('good');
                }}
                className="flex flex-col items-center gap-1.5 p-1 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl transition-all"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm bg-blue-50 text-blue-600 border border-blue-100">
                  <Star size={18} />
                </div>
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-blue-500">
                  Good
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSrsAction('easy');
                }}
                className="flex flex-col items-center gap-1.5 p-1 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl transition-all"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm bg-green-50 text-green-600 border border-green-100">
                  <Zap size={18} />
                </div>
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-green-500">
                  Easy
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRatingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setShowRatingModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRatingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-2">
              目前學習表現
            </h3>
            <div className="text-6xl my-4 drop-shadow-md">
              {getRating().emoji}
            </div>
            <div
              className={`text-4xl font-black ${
                getRating().color
              } mb-1 drop-shadow-sm`}
            >
              {getRating().score} 分
            </div>
            <div className="text-lg font-bold text-slate-600 mb-6">
              {getRating().text}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
              <div className="text-sm font-bold text-slate-500 mb-1 tracking-wide">
                目前完成率
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {Math.round(
                  ((totalInitial - queue.length) / totalInitial) * 100
                )}
                %
              </div>
            </div>

            <button
              onClick={() => setShowRatingModal(false)}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg"
            >
              繼續練習
            </button>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .transform-style-3d { transform-style: preserve-3d; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `,
        }}
      />
    </div>
  );
};

export default App;
