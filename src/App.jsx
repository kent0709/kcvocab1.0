import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, RefreshCcw, Brain, Zap, Star, Flame, Share2, Check, Loader2, AlertTriangle, ChevronRight, Clock, Home, Trophy, Lock, Trash2, Shuffle
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

// --- 2. 金鑰自動讀取 ---
const getEnvKey = () => {
  try {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    const k = env?.VITE_GEMINI_API_KEY;
    if (k && (k === firebaseConfig.apiKey || k === "AIzaSyBTcPWX29sXFY0dqzOpJn8We6uoJLwHv9U")) return ""; 
    return k;
  } catch(e) {}
  return "";
};

const getLocalKey = () => {
  try { return localStorage.getItem('my_gemini_key') || ""; } catch(e) { return ""; }
};

const isCanvas = typeof __firebase_config !== 'undefined';
const app = initializeApp(isCanvas ? JSON.parse(__firebase_config) : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : (firebaseConfig.projectId !== '請在此填入新的_projectId' ? firebaseConfig.projectId : 'kcvocabapp');

const safePushState = (url) => {
  try {
    const hostname = window.location.hostname;
    if (
      window.location.protocol === 'blob:' || 
      window.origin === 'null' || 
      hostname.includes('webcontainer') || 
      hostname.includes('stackblitz') ||
      hostname.includes('usercontent')
    ) return;
    window.history.pushState({}, '', url);
  } catch (e) {}
};

// --- 💡 終極壓縮版 單字庫 ---
const rawData = `zero,零|one,一|two,二|three,三|four,四|five,五|six,六|seven,七|eight,八|nine,九|ten,十|eleven,十一|twelve,十二|thirteen,十三|fourteen,十四|fifteen,十五|sixteen,十六|seventeen,十七|eighteen,十八|nineteen,十九|twenty,二十|thirty,三十|forty,四十|fifty,五十|sixty,六十|seventy,七十|eighty,八十|ninety,九十|hundred,百|I,我|You,你（你們）|We,我們|They,他們|He,他（男）|She,她（女）|It,它（牠）|my,我的|your,你的（你們的）|his,他的（男）|her,她的（女）|its,它的、牠的|grandmother,阿嬤|grandfather,阿公|mother,媽媽|father,爸爸|sister,姊妹|brother,兄弟|baby,嬰兒|girl,女孩|boy,男孩|woman,女人|man,男人|cook,廚師|teacher,老師|student,學生|farmer,農夫|doctor,醫生|nurse,護理師|driver,司機|head,頭|hair,頭髮|eye,眼睛|nose,鼻子|mouth,嘴巴|ear,耳朵|hand,手|leg,腿|foot,腳|hat,帽子|glasses,眼鏡|shirt,襯衫|shorts,短褲|pants,長褲|skirt,裙子|dress,洋裝|socks,襪子|shoes,鞋子|boots,靴子|bear,熊|dog,狗|cat,貓|bird,鳥|rabbit,兔|frog,青蛙|fish,魚|chicken,雞|turtle,烏龜|lion,獅子|tiger,虎|monkey,猴子|giraffe,長頸鹿|fox,狐狸|zebra,斑馬|pig,豬|elephant,大象|pen,原子筆|pencil,鉛筆|marker,麥克筆|eraser,橡皮擦|ruler,尺|book,書|bag,袋子|desk,書桌|table,餐桌|chair,椅子|crayon,蠟筆|box,箱子|door,門|window,窗戶|picture,圖片|TV,電視|sofa,沙發|light,光|bed,床|lamp,燈|clock,時鐘|cellphone,手機|videogame,電動|computer,電腦|cup,杯子|mug,馬克杯|bowl,碗|ball,球|yoyo,溜溜球|bat,球棒|robot,機器人|kite,風箏|doll,娃娃|mop,拖把|map,地圖|weather,天氣|sun,太陽|cloud,雲|wind,風|rain,雨|snow,雪|river,河|flower,花|grass,草|tree,樹|bike,腳踏車|car,車|bus,公車|train,火車|taxi,計程車|breakfast,早餐|lunch,午餐|dinner,晚餐|cookie,餅乾|icecream,冰淇淋|candy,糖果|hamburger,漢堡|hotdog,熱狗|pizza,比薩|bread,麵包|sandwich,三明治|cake,蛋糕|rice,飯|noodles,麵|spaghetti,義大利麵|tea,茶|coke,可樂|soda,汽水|water,水|juice,果汁|milk,牛奶|egg,蛋|ham,火腿|salad,沙拉|tomato,番茄|banana,香蕉|apple,蘋果|pear,梨子|grape,葡萄|peach,桃子|home,家|school,學校|park,公園|zoo,動物園|store,商店|shop,商店|house,房子|garage,車庫|livingroom,客廳|diningroom,飯廳|kitchen,廚房|bedroom,臥室|bathroom,浴室、廁所|yard,庭院|garden,花園、菜園|o'clock,點鐘|now,現在|morning,早上|afternoon,下午|evening,傍晚|night,晚上|today,今天|Sunday,星期天|Monday,星期一|Tuesday,星期二|Wednesday,星期三|Thursday,星期四|Friday,星期五|Saturday,星期六|do,做|like,喜歡|love,愛|want,想要|have,擁有|run,跑|walk,走路|swim,游泳|jump,跳|ride,騎|dance,跳舞|sing,唱|write,寫|read,閱讀|draw,畫|color,上色|paint,畫|speak,說|say,說|eat,吃|drink,喝|look,看|watch,看|see,看|listen,聽|smile,微笑|laugh,大笑|cry,哭|hold,拿|put,放|take,拿|sit,坐|stand,站|fine,好的|good,好的|bad,壞的|favorite,最喜歡的|big,大的|small,小的|little,小的|old,老的、舊的|young,年輕的|tall,高的|long,長的|short,短的|thin,瘦的、薄的|fat,胖的|fast,快的|slow,慢的|clean,乾淨的|dirty,髒的|hungry,餓的|thirsty,渴的|happy,開心的|unhappy,不開心的|sad,傷心的|angry,生氣的|sick,生病的|tired,累的|hot,熱的|cold,冷的|rainy,下雨的|snowy,下雪的|sunny,晴朗的|cloudy,多雲的|windy,起風的|black,黑色的|white,白色的|gray,灰色的|brown,咖啡色的|red,紅色的|orange,橘色的|yellow,黃色的|green,綠色的|blue,藍色的|purple,紫色的|pink,粉紅色的|at,在…地點|in,在…裡面|on,在…上面|under,在…下面|by,在…旁邊|nextto,在…旁邊|beside,在…旁邊|infrontof,在…前面|behind,在…後面|who,誰|what,什麼|when,何時|where,哪裡|which,哪一個|why,為什麼|whattime,幾點|how,如何|howmuch,多少|howmany,多少|east,東方|Easter,復活節|easy,容易的|eat,吃|edge,邊緣|education,教育|effect,效果、影響|effort,努力|egg,蛋|eight,八|eighteen,十八|eighty,八十|either,也不、兩者之一|elder,長輩、較年長的|elect,選舉|element,元素|elephant,大象|eleven,十一|else,其他|email,電子郵件|embarrass,使困窘|emphasize,強調|employ,雇用|empty,空的|end,結束|enemy,敵人|energy,能源、能量|engine,引擎|engineer,工程師|enjoy,享受|enough,足夠的|enter,進入|entire,整個的|entrance,入口|envelope,信封|environment,環境|envy,嫉妒、羨慕|equal,相等的|eraser,橡皮擦|error,錯誤|escape,逃跑|especially,特別地|essay,論文、散文|Europe,歐洲|European,歐洲的|even,甚至|evening,傍晚|event,事件|ever,曾經|every,每個|everybody,每個人|everyday,每天的|everyone,每個人|everything,每件事|everywhere,到處|evidence,證據|evil,邪惡的|exact,精確的|examine,檢查、考試|example,例子|excellent,優秀的|except,除了...之外|excite,使興奮|excitement,興奮|excuse,藉口、原諒|exercise,運動、練習|exist,存在|exit,出口|expect,期待|expensive,昂貴的|experience,經驗|experiment,實驗|expert,專家|explain,解釋|explanation,解釋|explore,探險|express,表達|expression,表達、表情|extra,額外的|eye,眼睛|face,臉、面對|fact,事實|factory,工廠|fail,失敗、不及格|failure,失敗|fair,公平的|fall,落下、秋天|false,錯誤的|family,家庭|famous,有名的|fan,扇子、迷|fancy,精緻的、想像|fantastic,極好的|far,遠的|farm,農場|farmer,農夫|fashionable,流行的|fast,快的|fat,胖的|father,父親|faucet,水龍頭|fault,錯誤、缺點|favor,幫助、偏愛|favorite,最喜愛的|fear,害怕|February,二月|fee,費用|feed,餵食|feel,感覺|feeling,感覺|female,女性的|fence,籬笆|festival,節日|fever,發燒|few,很少|fiction,小說|field,田野、領域|fifteen,十五|fifty,五十|fight,戰鬥、打架|figure,數字、人物|fill,充滿|film,電影|final,最後的|finally,最後|find,找到|fine,好的|finger,手指|finish,完成|fire,火|fireengine,消防車|fireman,消防員|firm,堅定的|first,第一|fish,魚|fisherman,漁夫|fit,適合|five,五|fix,修理|flag,旗子|flash,閃光|flashlight,手電筒|flat,平坦的|flight,班機|float,漂浮|floor,地板|flour,麵粉|flow,流動|flower,花|flu,流感|flute,笛子|fly,飛|focus,焦點|fog,霧|foggy,有霧的|follow,跟隨|food,食物|fool,傻瓜|foolish,愚蠢的|foot,腳|football,足球|for,為了|force,力量|foreign,外國的|foreigner,外國人|forest,森林|forget,忘記|forgive,原諒|fork,叉子|form,表格|formal,正式的|former,前者的|forty,四十|forward,向前|fox,狐狸|France,法國|frank,率直的|free,自由的|freedom,自由|freezer,冷凍櫃|freezing,極冷的|French,法國的|Frenchfries,炸薯條|frequent,頻繁的|fresh,新鮮的|Friday,禮拜五|friedchicken,炸雞|friedrice,炒飯|friend,朋友|friendly,友善的|friendship,友誼|frighten,使驚恐|Frisbee,飛盤|frog,青蛙|from,從|front,前面|fruit,水果|fry,煎、炸|full,滿的|fun,樂趣|function,功能|funny,好笑的|furniture,傢俱|future,未來|gain,獲得|game,遊戲|garage,車庫|garden,花園|gas,瓦斯|gasstation,加油站|gate,大門|gather,聚集|general,一般的|generally,一般地|generation,世代|generous,慷慨的|genius,天才|gentle,溫和的|gentleman,紳士|geography,地理|gesture,手勢|get,得到|getin,進入|getoff,下車|geton,上車|ghost,鬼|giant,巨大的|gift,禮物|girl,女孩|girlfriend,女朋友|give,給|givenname,名字|glad,高興的|glass,玻璃|glasses,眼鏡|glove,手套|glue,膠水|go,去|goal,目標|goat,山羊|god,神|gold,黃金|golden,金色的|golf,高爾夫|good,好的|good-looking,美貌的|goodness,善良|goodbye,再見|goose,鵝|government,政府|grade,年級|gradual,逐漸的|graduate,畢業|gram,公克|grand,盛大的|granddaughter,孫女|grandfather,爺爺|grandmother,奶奶|grandson,孫子|grape,葡萄|grapefruit,葡萄柚|grass,草|gray,灰色的|great,棒的|greedy,貪婪的|green,綠色的|greet,問候|ground,地面|group,群組|grow,生長|growup,長大|guard,警衛|guava,蕃石榴|guess,猜|guest,客人|guide,嚮導|guitar,吉他|gun,槍|guy,傢伙|gym,體育館|habit,習慣|hair,頭髮|haircut,理髮|hairdresser,美髮師|half,一半|hall,大廳|Halloween,萬聖節|ham,火腿|hamburger,漢堡|hammer,槌子|hand,手|handkerchief,手帕|handle,把手|handsome,英俊的|hang,懸掛|hanger,衣架|happen,發生|happy,快樂的|hard,硬的、努力的|hardly,幾乎不|hat,帽子|hate,討厭|have,有|he,他|head,頭|headache,頭痛|health,健康|healthy,健康的|hear,聽見|heart,心|heat,熱|heater,暖氣機|heavy,重的|height,高度|helicopter,直升機|hello,哈囉|help,幫助|helpful,有幫助的|hen,母雞|her,她的|here,這裡|hero,英雄|hey,嘿|hi,嗨|hide,躲藏|high,高的|highway,公路|hike,遠足|hiking,徒步旅行|hill,小山|him,他|hip,臀部|hippo,河馬|hire,雇用|history,歷史|hit,打|hobby,嗜好|hold,拿|hole,洞|holiday,假期|home,家|homesick,想家的|homework,作業|honest,誠實的|honesty,誠實|honey,蜂蜜|HongKong,香港|hope,希望|hop,單腳跳|horrible,恐怖的|horse,馬|hospital,醫院|host,主人|hot,熱的|hotdog,熱狗|hotel,飯店|hour,小時|house,房子|housewife,家庭主婦|housework,家事|how,如何|however,然而|huge,巨大的|human,人類的|humble,謙遜的|humid,潮濕的|humor,幽默|humorous,幽默的|hundred,百|hunger,飢餓|hungry,飢餓的|hunt,狩獵|hunter,獵人|hurry,趕快|hurt,受傷|husband,丈夫|I,我|ice,冰|icecream,冰淇淋|idea,主意|if,如果|ill,生病的|imagine,想像|impolite,無禮的|importance,重要性|important,重要的|impossible,不可能的|improve,改善|in,在裡面|inbackof,在後面|infrontof,在前面|inch,英吋|include,包含|income,收入|increase,增加|independent,獨立的|indicate,指示|industry,工業|influence,影響|information,資訊|ink,墨水|insect,昆蟲|insist,堅持|inspire,鼓舞|instant,立即的|instantnoodle,泡麵|instead,代替|instrument,樂器|intelligent,聰明的|interest,興趣|interested,感興趣的|interesting,有趣的|international,國際的|internet,網路|interrupt,打斷|interview,面試|introduce,介紹|invent,發明|invention,發明|invitation,邀請|invite,邀請|iron,鐵|island,島嶼|Italy,義大利|item,項目|its,它的|jacket,夾克|jam,果醬|January,一月|Japan,日本|Japanese,日語|jar,罐子|jazz,爵士樂|jealous,嫉妒的|jeep,吉普車|job,工作|jog,慢跑|jogging,慢跑|join,加入|joke,玩笑|journalist,記者|joy,歡樂|judge,判斷|juice,果汁|July,七月|jump,跳|June,六月|junior,初級的|just,剛好|kangaroo,袋鼠|Kaohsiung,高雄|keep,保持|ketchup,番茄醬|key,鑰匙|keyboard,鍵盤|kick,踢|kid,小孩|kill,殺|kilo,公斤|kilogram,公斤|kilometer,公里|kind,種類|kindergarten,幼稚園|king,國王|kingdom,王國|kiss,親吻|kitchen,廚房|kite,風箏|kitten,小貓|kitty,小貓|knee,膝蓋|knife,刀子|knight,騎士`;

const allVocab = rawData.split('|').map(item => {
  const [word, meaning] = item.split(',');
  return { word, meaning: meaning || word };
});

let fallbackIndex = 0;
while (allVocab.length < 900) {
  allVocab.push({
    word: allVocab[fallbackIndex].word,
    meaning: allVocab[fallbackIndex].meaning
  });
  fallbackIndex++;
}

const kinderCategories = [
  { name: "小班", icon: "🍼", start: 0, end: 100 },
  { name: "中班", icon: "🧸", start: 100, end: 200 },
  { name: "大班", icon: "🖍️", start: 200, end: 300 }
];

const gradeCategories = [
  { name: "一上", icon: "👶", start: 0, end: 50 }, { name: "一中", icon: "👶", start: 50, end: 100 }, { name: "一下", icon: "👶", start: 100, end: 150 },
  { name: "二上", icon: "🧒", start: 150, end: 200 }, { name: "二中", icon: "🧒", start: 200, end: 250 }, { name: "二下", icon: "🧒", start: 250, end: 300 },
  { name: "三上", icon: "👦", start: 300, end: 350 }, { name: "三中", icon: "👦", start: 350, end: 400 }, { name: "三下", icon: "👦", start: 400, end: 450 },
  { name: "四上", icon: "👧", start: 450, end: 500 }, { name: "四中", icon: "👧", start: 500, end: 550 }, { name: "四下", icon: "👧", start: 550, end: 600 },
  { name: "五上", icon: "🧑", start: 600, end: 650 }, { name: "五中", icon: "🧑", start: 650, end: 700 }, { name: "五下", icon: "🧑", start: 700, end: 750 },
  { name: "六上", icon: "👱", start: 750, end: 800 }, { name: "六中", icon: "👱", start: 800, end: 850 }, { name: "六下", icon: "👱", start: 850, end: 900 }
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
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [shareModal, setShareModal] = useState({ isOpen: false, url: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', message: '' });

  const [encouragement, setEncouragement] = useState('');
  const lastMilestoneRef = useRef(0);

  const translatingRef = useRef(new Set());
  const workingModelRef = useRef(isCanvas ? "gemini-2.5-flash-preview-09-2025" : "");
  const speechTimeoutRef = useRef(null);

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

    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
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

  const playSimpleText = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    
    const isEnglish = /[a-zA-Z]/.test(text) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(text);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = isEnglish ? 'en-US' : 'ja-JP';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const playCardSequence = (c) => {
    if (!c) return;
    window.speechSynthesis.cancel();
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    const isEnglishCard = /[a-zA-Z]/.test(c.word) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(c.word);
    const lang = isEnglishCard ? 'en-US' : 'ja-JP';

    let wordText = c.word;
    let exampleText = "";

    if (c.example || c.info.includes('【例句】')) {
      let exEn = c.example || "";
      if (!exEn && c.info.includes('【例句】')) {
        const exStr = c.info.split('【例句】')[1];
        const match = exStr.match(/^(.*?)\((.*?)\)(.*)$/);
        if (match) {
          exEn = match[1].trim();
        } else {
          exEn = exStr;
        }
      }
      // 💡 取代 " / " 讓語音朗讀可以自然停頓
      exampleText = exEn.replace(/\s\/\s/g, '. ');
    }

    const speakPart = (text, onEndCallback) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.85;
      if (onEndCallback) {
        u.onend = onEndCallback;
      }
      window.speechSynthesis.speak(u);
    };

    if (exampleText) {
      speakPart(wordText, () => {
        speechTimeoutRef.current = setTimeout(() => {
          speakPart(exampleText);
        }, 1000);
      });
    } else {
      speakPart(wordText);
    }
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
      } catch(err) {}
    }
  };

  const handleShuffle = async () => {
    if (queue.length <= 1) return;
    const newQueue = [...queue];
    for (let i = newQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
    }
    setQueue(newQueue);
    setIsFlipped(false);
    
    if (deckId && user) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), { queue: newQueue });
      } catch(err) {}
    }
  };

  const openConfirm = (type, message) => setConfirmDialog({ isOpen: true, type, message });
  const closeConfirm = () => setConfirmDialog({ isOpen: false, type: '', message: '' });

  const executeConfirm = () => {
    if (confirmDialog.type === 'home') {
      setCards([]); setQueue([]); setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false); setIsFlipped(false); setDeckId(null); setInput('');
      lastMilestoneRef.current = 0;
      safePushState(window.location.pathname);
    } else if (confirmDialog.type === 'finish') {
      setIsFinished(true);
    }
    closeConfirm();
  };

  const validateAndSaveKey = async () => {
    const tk = keyInput.trim();
    if (!tk) return;

    if (tk === firebaseConfig.apiKey || tk === "AIzaSyBTcPWX29sXFY0dqzOpJn8We6uoJLwHv9U") {
      setError('🚨 這把是「Firebase 資料庫」的鑰匙！請前往 Google AI Studio 申請真正的 AI 鑰匙！');
      return;
    }

    setIsValidatingKey(true); setError('');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${tk}`);
      if (!res.ok) {
        const data = await res.json();
        setError(`❌ 驗證失敗 (${res.status}): ${data.error?.message || "未知錯誤"}`);
        setIsValidatingKey(false);
        return;
      }
      
      const data = await res.json();
      const validModels = (data.models || []).filter(m => m.supportedGenerationMethods?.includes("generateContent")).map(m => m.name.replace("models/", ""));
      const preferred = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-pro"];
      workingModelRef.current = preferred.find(p => validModels.includes(p)) || validModels[0] || "";

      localStorage.setItem('my_gemini_key', tk);
      setActiveApiKey(tk);
    } catch (e) {
      setError("❌ 網路異常，無法驗證金鑰。");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const generate = async (overrideText = null) => {
    const targetText = typeof overrideText === 'string' ? overrideText : input;
    
    if (!targetText.trim() || genLoading) return;
    const reqKey = isCanvas ? "" : activeApiKey;
    if (!reqKey && !isCanvas) {
      setError('❌ 找不到 API 金鑰！請確認 Vercel 環境變數 VITE_GEMINI_API_KEY。');
      return;
    }

    setGenLoading(true); 
    setError('🔍 正在請 AI 為單字擴充詞性與例句...');
    
    const hasKana = /[\u3040-\u309F\u30A0-\u30FF]/.test(targetText);
    const hasEnglish = /[a-zA-Z]/.test(targetText);
    const isEn = hasEnglish && !hasKana;
    
    // 💡 調整 Prompt：讓英文模式能生出符合您要求的多詞性、同反義詞、與多例句的完美格式
    const prompt = isEn 
      ? `請分析以下文字：\n"""${targetText}"""\n這是一份「英文學習清單」。請提取出所有英文單字（務必完整包含輸入的所有單字，不可遺漏！）。\n⚠️極度重要：如果文字中混雜了單獨的「中文詞彙」，請務必自動將其「翻譯成英文單字」。\n請為每個單字提供更廣泛且結構化的解釋：\n1. 包含不同「詞性」的意思，並換行顯示。例如：\n(n.) 書；卷\n(v.) 預訂; 預約 (To reserve/order)\n2. 補充類似的「同類詞、同義詞」或相反的「反義詞」。例如：[同義詞] reserve, order / [反義詞] cancel\n3. 提供對應的英文例句，若有多個詞性請提供多句，並用「 / 」隔開。\n4. 提供對應的中文翻譯，多句請用「 / 」隔開。\n回傳 JSON 陣列：[{"word": "英文單字", "reading": "音標", "meaning": "不同詞性與意思(務必使用 \\n 換行)", "breakdown": "同義詞/反義詞補充", "example": "英文例句1 / 英文例句2", "example_kana": "", "example_zh": "中文翻譯1 / 中文翻譯2", "image_keyword": "用1到3個英文單字描述單字畫面的關鍵字"}]。請只回傳 JSON。`
      : `請分析以下文字：\n"""${targetText}"""\n這是一份「日文學習清單」。\n⚠️極度重要：即使使用者輸入的全部都是「純中文」，你也必須把它當作是想要學習的目標，自動將這些中文「翻譯成對應的日文單字」，並為其建立日文單字卡！\n回傳 JSON 陣列：[{"word": "日文單字(若來源為中文請翻譯成日文)", "reading": "讀音", "meaning": "詞性與意思 (若是動詞，務必明確標註為：第一/二/三類動詞)", "breakdown": "字句拆解(例如:根強い=根+強い)與意象說明 (請用生動通用的比喻幫助記憶)", "example": "例句", "example_kana": "例句平假名", "example_zh": "翻譯", "image_keyword": "用1到3個英文單字描述單字畫面的關鍵字(用來搜尋圖片)"}]。請只回傳 JSON。`;

    let modelToUse = isCanvas ? "gemini-2.5-flash-preview-09-2025" : workingModelRef.current;

    if (!modelToUse) {
        try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${reqKey}`);
            if (!listRes.ok) {
                if (listRes.status === 403) {
                    setError(`🚨 致命錯誤 (403)：您的金鑰完全沒有開通「AI 生成權限」！\n這通常是因為您在 Google Cloud 建立，卻沒有啟用 Generative Language API。\n👉 請用一個全新的 Google 帳號，前往 aistudio.google.com 重新申請一把！`);
                } else if (listRes.status === 400) {
                    setError(`🚨 致命錯誤 (400)：這把金鑰是假的或格式錯誤！`);
                    setActiveApiKey('');
                    try { localStorage.removeItem('my_gemini_key'); } catch(e){}
                } else {
                    const errData = await listRes.json();
                    setError(`❌ Google 拒絕連線 (${listRes.status}): ${errData.error?.message}`);
                }
                setGenLoading(false);
                return;
            }

            const listData = await listRes.json();
            const validModels = (listData.models || [])
                .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
                .map(m => m.name.replace("models/", ""));

            if (validModels.length === 0) {
                 setError(`🚨 驚人發現：鑰匙是真的，但 Google 說您「擁有 0 個可用模型」！\n這通常代表：\n1. 您的 Google Cloud 專案太舊或被限制。\n2. 您選擇的地區不支援 Gemini。\n👉 唯一解法：請用一個「全新的 Google 帳號」，登入 aistudio.google.com 重新申請！`);
                 setGenLoading(false);
                 return;
            }

            const preferred = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-pro"];
            modelToUse = preferred.find(p => validModels.includes(p)) || validModels[0];
            workingModelRef.current = modelToUse;

        } catch (e) {
            setError(`❌ 掃描模型失敗：請檢查網路連線。`);
            setGenLoading(false);
            return;
        }
    }

    setError(''); 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${reqKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };

    let success = false;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429 || res.status === 503) {
                    await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
                    lastError = "⏳ 伺服器目前接收到太多請求，請稍等幾秒後再試！";
                    continue; 
                } 
                if (res.status === 400 || res.status === 403) {
                    setActiveApiKey('');
                    workingModelRef.current = "";
                    try { localStorage.removeItem('my_gemini_key'); } catch(e){}
                    lastError = `🚨 您的 API 金鑰無效或權限被收回，請重新設定！`;
                    break;
                }
                if (res.status === 404) {
                    workingModelRef.current = ""; 
                    lastError = `🚨 模型 ${modelToUse} 突然失效，請再點擊一次重新掃描。`;
                    break;
                }
                
                lastError = `發生錯誤：${data.error?.message || "未知錯誤"}`;
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
              image_keyword: c.image_keyword || 'study',
              info: `${c.reading || ''} ${c.meaning || ''} 💡 [分析] ${c.breakdown || ''} 【例句】${c.example || ''}(${c.example_kana || ''})${c.example_zh || ''}`
            }));
            
            setCards(newCards);
            setQueue(Array.from({length: newCards.length}, (_, i) => i));
            setTotal(newCards.length);
            setIsFinished(false); setIsFlipped(false);
            success = true;
            lastMilestoneRef.current = 0;
            break; 
            
        } catch (e) { 
            if (attempt < 2) {
                await new Promise(r => setTimeout(r, 2000));
            } else {
                lastError = `系統連線異常：請稍後再試。`;
            }
        }
    }

    if (!success) setError(`❌ ${lastError}`);
    setGenLoading(false);
  };

  const loadPresetCards = (vocabList, useAI = true) => {
    const wordsOnlyStr = vocabList.map(item => item.word).join('\n');
    setInput(wordsOnlyStr);

    if (useAI) {
      generate(wordsOnlyStr); 
    } else {
      const newCards = vocabList.map(item => ({
        word: item.word,
        reading: '',
        meaning: item.meaning,
        breakdown: '',
        example: '',
        example_kana: '',
        example_zh: '',
        image_keyword: item.word, 
        info: item.meaning 
      }));
      
      setCards(newCards);
      setQueue(Array.from({length: newCards.length}, (_, i) => i));
      setTotal(newCards.length);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false); 
      setIsFlipped(false);
      lastMilestoneRef.current = 0;
      setError('');
    }
  };

  useEffect(() => {
    if (cards.length === 0 || isFinished) return;

    const loadImages = async () => {
      const nextCards = queue.slice(0, 2).map(idx => cards[idx]);
      for (const card of nextCards) {
        if (!card || imageUrls[card.word]) continue;
        
        let imgQuery = card.image_keyword || "study,japan";
        if (!/[a-zA-Z]/.test(imgQuery)) imgQuery = "study,japan";
        
        setImageUrls(prev => ({ ...prev, [card.word]: `https://loremflickr.com/400/300/${encodeURIComponent(imgQuery)}` }));
      }
    };
    loadImages();
  }, [queue, cards, isFinished, imageUrls]);

  useEffect(() => {
    if (queue.length > 0 && !isFinished && cards.length > 0) {
      if (isFlipped) {
        playCardSequence(cards[queue[0]]);
      }
    }
  }, [queue, isFlipped, isFinished, cards]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && cards.length > 0 && !isFinished) {
        if (!isFlipped) setIsFlipped(true);
        else playCardSequence(cards[queue[0]]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, cards, queue, isFinished]);

  useEffect(() => {
    if (total === 0 || isFinished) return;
    const completedCount = total - queue.length;
    
    if (completedCount > 0 && completedCount % 10 === 0 && completedCount !== lastMilestoneRef.current && completedCount !== total) {
      const messages = [
        "你好厲害！🎉", "你真是記單字高手！💪", "你好強！🔥", 
        "快要完成了哦！🚀", "有點厲害！😎", "太棒了！✨", 
        "無人能敵！👑", "繼續保持！🎯"
      ];
      setEncouragement(messages[Math.floor(Math.random() * messages.length)]);
      lastMilestoneRef.current = completedCount;

      setTimeout(() => {
        setEncouragement('');
      }, 2500);
    }
  }, [queue.length, total, isFinished]);

  const getRating = () => {
    const t = history.again + history.hard + history.good + history.easy;
    if (t === 0) return { score: 0, text: "尚未作答", color: "text-slate-500", emoji: "🤔" };
    const score = Math.round(((history.easy * 100) + (history.good * 100) + (history.hard * 50)) / t);
    if (score >= 90) return { score, text: "極佳", color: "text-green-500", emoji: "🏆" };
    if (score >= 60) return { score, text: "穩定", color: "text-blue-500", emoji: "🌟" };
    return { score, text: "加油", color: "text-orange-500", emoji: "💪" };
  };

  // 💡 v13.14 全新統一渲染器：完美支援結構化資料與換行顯示，取代原本的 formatBackHeader
  const renderCardBackText = (card) => {
    if (!card) return null;
    const isEnglishCard = /[a-zA-Z]/.test(card.word) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(card.word);
    
    let reading = card.reading || '';
    let meaning = card.meaning || '';
    let breakdown = card.breakdown || '';
    let exEn = card.example || '';
    let exKana = card.example_kana || '';
    let exZh = card.example_zh || '';
    
    // 向下相容舊的 info 字串格式 (如果是存進資料庫的舊卡片)
    if (!meaning && card.info) {
       const mainPart = card.info.split('【例句】')[0].trim();
       const parts = mainPart.split('💡').map(p => p.trim());
       const headerText = parts[0];
       const firstSpaceIdx = headerText.indexOf(' ');
       
       if (firstSpaceIdx !== -1) {
         reading = headerText.substring(0, firstSpaceIdx).trim();
         meaning = headerText.substring(firstSpaceIdx).trim();
       } else {
         meaning = headerText;
       }
       
       const extraSections = parts.slice(1);
       if (extraSections.length > 0) {
         breakdown = extraSections.map(s => s.replace(/\[.*?\]\s*/, '').trim()).join('\n');
       }
       
       if (card.info.includes('【例句】')) {
         const exStr = card.info.split('【例句】')[1];
         const match = exStr.match(/^(.*?)\((.*?)\)(.*)$/);
         if (match) {
           exEn = match[1].trim();
           exKana = match[2].trim();
           exZh = match[3].trim();
         } else {
           exEn = exStr;
         }
       }
    }

    return (
      <div className="flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar flex flex-col text-left">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 leading-tight">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-indigo-900 tracking-wide">{card.word}</span>
            {reading && <span className="text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">{reading}</span>}
          </div>
          
          {/* 詞性與意思 */}
          <div className="text-slate-700 text-lg mb-2 whitespace-pre-line leading-snug font-bold">
            {meaning}
          </div>
          
          {/* 同反義詞或字根拆解 */}
          {breakdown && (
            <div className="mt-2 text-sm text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-100/50 leading-relaxed font-bold shadow-sm whitespace-pre-line">
              💡 {breakdown}
            </div>
          )}
        </div>

        {/* 例句區塊 */}
        {(exEn || exZh) && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-2 space-y-2">
            {exEn && <div className="text-base sm:text-lg font-black text-slate-800 leading-tight tracking-wide whitespace-pre-line">{exEn.replace(/\s\/\s/g, '\n')}</div>}
            {exKana && !isEnglishCard && <div className="text-[13px] font-bold text-indigo-500 leading-tight whitespace-pre-line">{exKana.replace(/\s\/\s/g, '\n')}</div>}
            {exZh && <div className="text-sm font-bold text-slate-600 leading-tight whitespace-pre-line">{exZh.replace(/\s\/\s/g, '\n')}</div>}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

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
            請前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-500 underline font-bold">Google AI Studio</a> 申請金鑰。<br/><br/>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">系統會自動驗證金鑰是否有效！</span>
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
            {isValidatingKey ? '驗證中...' : '驗證進入 App'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
        <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-6 text-slate-800">Killer Cards</h1>
        
        <div className="bg-indigo-50/50 p-4 rounded-2xl mb-5 border border-indigo-100">
          <div className="text-[13px] font-black text-indigo-800 mb-3 text-left flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            免輸入！一鍵請 AI 擴充詞性與例句
          </div>
          
          <div className="max-h-[260px] overflow-y-auto custom-scrollbar pr-2 pb-1">
            <div className="grid grid-cols-3 gap-2.5">
              {[...kinderCategories, ...gradeCategories].map((cat, index) => {
                const useAI = !cat.name.includes('班');
                return (
                  <button 
                    key={`cat-${index}`}
                    onClick={() => loadPresetCards(allVocab.slice(cat.start, cat.end), useAI)} 
                    className="bg-white hover:bg-indigo-50 text-indigo-700 font-bold py-2.5 px-1 rounded-xl text-[13px] sm:text-[14px] transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1 active:scale-95"
                  >
                    <span className="text-2xl drop-shadow-sm">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold tracking-wider">或輸入自訂單字</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="貼上想背的單字..." className="w-full h-32 p-5 mb-4 bg-slate-50 border-2 rounded-3xl outline-none focus:border-indigo-500 font-medium resize-none shadow-inner" />
        
        {error && (
          <div className={`p-4 rounded-2xl text-[12px] font-bold mb-4 text-left flex gap-2 leading-relaxed whitespace-pre-wrap ${error.includes('連線失敗') || error.includes('發現') || error.includes('錯誤') || error.includes('系統異常') || error.includes('異常') || error.includes('限制') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {error.includes('請求') || error.includes('掃描') || error.includes('請 AI 為單字擴充') ? <Clock size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
            {error}
          </div>
        )}

        <button onClick={generate} disabled={genLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {genLoading ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />} {genLoading ? '處理中...' : 'AI 智慧生成單字卡'}
        </button>
        
        <div className="mt-8 text-slate-300 text-[10px] font-black tracking-widest flex items-center justify-center">
          <span>v13.14 多義詞與完美排版版 byKC</span>
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
          <div className={`text-5xl font-black ${r.color} mb-6`}>{r.score} <span className="text-xl text-slate-400 font-bold ml-1">分 - {r.text}</span></div>
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
          
          <div className="flex gap-3 w-full">
            <button onClick={() => { 
                setQueue(Array.from({length: cards.length}, (_, i) => i)); 
                setHistory({again:0, hard:0, good:0, easy:0}); 
                setIsFinished(false); 
                lastMilestoneRef.current = 0; 
            }} className="flex-1 bg-slate-200 text-slate-700 font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:bg-slate-300 transition-all">
              <RefreshCcw size={18} />循序重來
            </button>
            <button onClick={() => { 
                const newQ = Array.from({length: cards.length}, (_, i) => i);
                for(let i = newQ.length - 1; i > 0; i--){
                    const j = Math.floor(Math.random() * (i + 1));
                    [newQ[i], newQ[j]] = [newQ[j], newQ[i]];
                }
                setQueue(newQ); setHistory({again:0, hard:0, good:0, easy:0}); setIsFinished(false); 
                lastMilestoneRef.current = 0; 
            }} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all">
              <Shuffle size={18} />洗牌重來
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[queue[0]];
  const progress = total === 0 ? 0 : ((total - queue.length) / total) * 100;
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-4 font-sans text-slate-800 h-[100dvh] relative overflow-hidden">
      
      {encouragement && (
        <div className="fixed top-[25%] left-1/2 transform -translate-x-1/2 z-[100] animate-bounce pointer-events-none">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-6 py-3 rounded-full shadow-2xl text-lg sm:text-xl whitespace-nowrap border-4 border-white">
            {encouragement}
          </div>
        </div>
      )}

      {shareModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4"><Share2 size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2">進度已儲存！</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">請複製下方專屬網址，傳給朋友或用手機打開就能繼續背單字囉：</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 flex items-center gap-2">
              <input type="text" readOnly value={shareModal.url} className="w-full bg-transparent text-sm text-slate-600 font-medium outline-none" />
            </div>
            <button onClick={() => { try { navigator.clipboard.writeText(shareModal.url); } catch(e){} setShareModal({ isOpen: false, url: '' }); }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-md flex justify-center items-center gap-2">
              <Check size={18} /> 複製並關閉
            </button>
          </div>
        </div>
      )}

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

      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRatingModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            <h3 className="text-xl font-black text-slate-800 mb-2">目前學習表現</h3>
            <div className="text-6xl my-4 drop-shadow-md">{getRating().emoji}</div>
            <div className={`text-4xl font-black ${getRating().color} mb-1 drop-shadow-sm`}>{getRating().score} 分</div>
            <div className="text-lg font-bold text-slate-600 mb-6">{getRating().text}</div>
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
              <div className="text-sm font-bold text-slate-500 mb-1 tracking-wide">目前完成率</div>
              <div className="text-2xl font-black text-indigo-600">{Math.round(progress)}%</div>
            </div>
            <button onClick={() => setShowRatingModal(false)} className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg">繼續練習</button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="w-full max-w-md mb-3 space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-700 font-black text-lg bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <button onClick={() => openConfirm('home', '確定放棄進度回首頁？')} className="text-slate-400 hover:text-red-500"><Home size={18}/></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <Brain size={20} className="text-indigo-600" />
            <span>{total - queue.length} <span className="text-slate-400 text-sm font-medium">/ {total}</span></span>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={handleShuffle} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="隨機洗牌"><Shuffle size={18}/></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={() => setShowRatingModal(true)} className="flex items-center gap-1 text-[13px] text-amber-600 hover:text-amber-700 transition-colors font-bold">📊 評分</button>
          </div>
          
          <button onClick={async () => {
            if (!user) return setError("尚未連線資料庫");
            if (isSaving) return;
            setIsSaving(true);
            try {
              let shareId = deckId || crypto.randomUUID();
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', shareId), { cards, queue, history, creator: user.uid, createdAt: new Date().toISOString() });
              setDeckId(shareId); safePushState(`?deckId=${shareId}`);
              const url = `${window.location.origin}${window.location.pathname}?deckId=${shareId}`;
              try { await navigator.clipboard.writeText(url); } catch(e) {}
              setCopyOk(true); setTimeout(() => setCopyOk(false), 2000);
              setShareModal({ isOpen: true, url });
            } catch (err) { setError("儲存失敗"); } 
            finally { setIsSaving(false); }
          }} disabled={isSaving} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${copyOk ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : copyOk ? <Check size={16} /> : <Share2 size={16} />}
            {copyOk ? '已複製連結' : '儲存與分享'}
          </button>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
          <div className="bg-indigo-500 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative w-full max-w-md flex-1 min-h-[450px] cursor-pointer perspective-1000 group mb-2" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-8 border border-slate-100">
            <h2 className="text-[4rem] font-black text-slate-800 text-center leading-tight mb-10 break-words w-full">{card.word}</h2>
            <button onClick={e => { e.stopPropagation(); playSimpleText(card.word); }} className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 hover:scale-105 transition-all shadow-md"><Volume2 size={40} /></button>
            <div className="absolute bottom-8 text-slate-400 text-sm font-bold tracking-widest animate-pulse">點擊翻面</div>
          </div>
          
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[2rem] shadow-xl flex flex-col p-4 sm:p-5 overflow-hidden border border-slate-100">
            
            <div className="w-full h-36 sm:h-40 bg-slate-100 rounded-xl mb-3 overflow-hidden relative flex items-center justify-center shadow-inner shrink-0">
              {imageUrls[card.word] ? (
                <img src={imageUrls[card.word]} className="w-full h-full object-cover z-10" alt="" onError={e => e.target.src='https://loremflickr.com/400/300/japan'} />
              ) : (
                <div className="flex flex-col items-center text-indigo-400"><Loader2 className="w-6 h-6 animate-spin mb-1" /><span className="text-[10px] font-black uppercase">Loading...</span></div>
              )}
            </div>

            {/* 💡 使用全新的渲染器，完美支援結構化資料、換行與例句切割 */}
            {renderCardBackText(card)}

            <div className="grid grid-cols-5 gap-2 mt-auto pt-3 border-t border-slate-100 shrink-0 items-end pb-1">
              <button onClick={(e) => { e.stopPropagation(); handleAction('again'); }} className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm bg-red-50 text-red-600 border border-red-100"><RefreshCcw size={24} /></div>
                <span className="text-xs font-black uppercase tracking-wider text-red-500">Again</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleAction('hard'); }} className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm bg-orange-50 text-orange-600 border border-orange-100"><Flame size={24} /></div>
                <span className="text-xs font-black uppercase tracking-wider text-orange-500">Hard</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); playCardSequence(card); }} className="flex flex-col items-center justify-start gap-1.5 hover:scale-105 active:scale-95 transition-all -mt-3 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg bg-indigo-600 text-white border-4 border-indigo-100 group-hover:bg-indigo-700">
                  <Volume2 size={32} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Listen</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleAction('good'); }} className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm bg-blue-50 text-blue-600 border border-blue-100"><Star size={24} /></div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-500">Good</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleAction('easy'); }} className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm bg-green-50 text-green-600 border border-green-100"><Zap size={24} /></div>
                <span className="text-xs font-black uppercase tracking-wider text-green-500">Easy</span>
              </button>
            </div>

          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }` }} />
    </div>
  );
};

export default App;