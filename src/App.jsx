<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Card Card Love v4.3</title>
    <style>
        /* 針對長螢幕手機優化，確保全畫面不捲動 */
        :root {
            --safe-top: env(safe-area-inset-top, 20px);
            --safe-bottom: env(safe-area-bottom, 20px);
        }

        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            height: 100dvh;
            background-color: #f0f8ff;
            font-family: 'Microsoft JhengHei', 'PingFang TC', sans-serif;
            margin: 0;
            padding: var(--safe-top) 15px var(--safe-bottom) 15px;
            box-sizing: border-box;
            overflow: hidden;
        }

        /* 升級版：更大更有氣勢的標題 */
        .app-title {
            font-size: clamp(38px, 11vw, 55px);
            font-weight: 900;
            color: #ff9f43;
            text-shadow: 3px 3px 0px #ffeaa7;
            margin: 8px 0;
            letter-spacing: 2px;
            cursor: pointer;
            flex-shrink: 0;
            transition: transform 0.2s;
        }
        .app-title:active { transform: scale(0.95); }

        .home-subtitle {
            font-size: 16px;
            color: #a4b0be;
            font-weight: bold;
            margin-bottom: 15px;
            flex-shrink: 0;
        }

        .main-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 0;
        }

        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 95%;
            max-width: 350px;
            max-height: 60vh;
            overflow-y: auto;
            padding: 5px;
        }

        .lang-btn {
            padding: 15px;
            font-size: clamp(15px, 5vw, 20px);
            font-weight: bold;
            border: none;
            border-radius: 18px;
            cursor: pointer;
            color: white;
            box-shadow: 0 5px 0 rgba(0,0,0,0.1);
            transition: 0.2s;
            flex-shrink: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .lang-btn:active { transform: translateY(3px); box-shadow: none; }
        .btn-zhuyin { background-color: #00a8ff; }
        .btn-hiragana { background-color: #ff4757; }
        .btn-katakana { background-color: #2ed573; }
        .btn-math { background-color: #e67e22; }

        /* 單元選擇畫面 */
        .unit-select-wrapper {
            display: none;
            flex-direction: column;
            align-items: center;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            padding-bottom: 20px;
        }

        .top-bars {
            display: none; 
            flex-direction: column; 
            gap: 8px; 
            margin-bottom: 10px; 
            width: 100%; 
            max-width: 350px;
        }

        .mode-switch { 
            display: flex; 
            gap: 6px; 
            flex-wrap: wrap;
            justify-content: center;
        }
        .mode-btn {
            padding: 8px 12px;
            border-radius: 12px;
            border: none;
            background: #fff;
            color: #a4b0be;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            flex: 1;
            min-width: 60px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: all 0.2s;
        }
        .mode-btn:active { transform: scale(0.95); }
        .mode-btn.active { color: white; }

        /* 字卡本體 */
        .card {
            display: none;
            background: white;
            width: 100%;
            max-width: 320px;
            height: clamp(340px, 50vh, 440px);
            border-radius: 25px;
            box-shadow: 0 8px 15px rgba(0,0,0,0.1);
            padding: 15px 18px;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            box-sizing: border-box;
            border: 6px solid #00a8ff;
            position: relative;
        }

        .main-sym { 
            font-size: clamp(65px, 14vh, 90px); 
            font-weight: bold; 
            color: #4a148c; 
            text-align: center;
            word-break: break-word;
            line-height: 1.2;
        }
        .emoji { font-size: clamp(50px, 10vh, 70px); margin: 5px 0;}
        
        .word-box {
            background: #f1f2f6;
            padding: 10px 15px;
            border-radius: 15px;
            width: 95%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 45px;
        }

        .controls { display: none; margin-top: 10px; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 320px; }
        .ctrl-btn { padding: 10px; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.2s;}
        .ctrl-btn:active { transform: scale(0.95); }
        .btn-p { background: #dfe4ea; flex: 1; min-width: 60px; color:#2f3542; }
        .btn-s { background: #ff9f43; color: white; flex: 2; min-width: 120px; }
        .btn-math-reveal { background: #e67e22; color: white; flex: 2; min-width: 120px; }

        /* 升級版：專屬放大的下一題按鈕 */
        #nextQBtn {
            font-size: 22px;
            font-weight: 900;
            padding: 16px 20px;
            width: 100%;
            border: none;
            border-radius: 18px;
            background-color: #2ed573;
            color: white;
            cursor: pointer;
            box-shadow: 0 6px 0 #27ae60;
            margin-top: 10px;
            letter-spacing: 2px;
            transition: all 0.1s;
        }
        #nextQBtn:active {
            transform: translateY(6px);
            box-shadow: none;
        }

        .quiz-view { display: none; width: 100%; flex-direction: column; align-items: center; overflow-y: auto; padding-bottom: 10px;}
        .opt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; margin-top: 10px; }
        
        .opt-btn { 
            background: white; border: 2px solid #f1f2f6; border-radius: 15px; 
            font-weight: bold; padding: 10px 5px; border-bottom: 4px solid #dfe4ea; 
            cursor: pointer; word-break: break-word; line-height: 1.2; min-height: 50px;
            transition: all 0.1s;
        }
        .opt-btn:active { transform: translateY(2px); border-bottom: 0; }
        .opt-btn.correct { border-color: #2ed573; color: #2ed573; background: #e8fcf1; }
        .opt-btn.wrong { border-color: #ff4757; color: #ff4757; background: #ffeaea; animation: shake 0.4s; } 

        .app-footer {
            font-size: 12px;
            color: #a4b0be;
            margin-top: 5px;
            font-weight: bold;
            flex-shrink: 0;
        }

        .zh-char-row { display: flex; align-items: center; margin: 0 2px; }
        .zh-text { font-size: 28px; font-weight: bold; color: #4a148c; margin-right: 2px;}
        .zy-stack { display: flex; flex-direction: column; font-size: 12px; line-height: 1; font-weight: bold; color: #4a148c;}
        .jp-text { font-size: 26px; font-weight: bold; color: #4a148c; }
        .jp-mean { font-size: 14px; color: #ff4757; font-weight: bold; margin-top: 2px; }
        
        .math-formula { font-size: 20px; font-weight: bold; color: #e67e22; font-family: monospace; text-align: center; transition: all 0.3s ease;}
        .math-hint { font-size: 14px; color: #666; font-weight: bold; margin-top: 4px; text-align: center; transition: all 0.3s ease;}
        .math-exp { margin-top:8px; padding-top:8px; border-top:1px dashed #ccc; font-size:14px; color:#27ae60; font-weight:bold; width: 100%; text-align: center; }

        .blur-content { filter: blur(8px); opacity: 0.5; user-select: none; }

        /* 排行榜專屬樣式 */
        .lb-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 12px;
            font-weight: bold;
            border: 1px solid #eee;
        }
        .lb-rank-1 { background: #fff8e1; border-color: #ffeaa7; color: #d35400; }
        .lb-rank-2 { background: #f1f2f6; border-color: #dfe4ea; color: #576574; }
        .lb-rank-3 { background: #ffebd2; border-color: #f3cc9a; color: #a0522d; }

        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } 60% { transform: translateY(-6px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
    </style>
</head>
<body>

<!-- Firebase 設定引導精靈 (當權限被阻擋時彈出) -->
<div id="firebaseSetupWizard" style="display:none; position:fixed; top:0; left:0; width:100%; height:100dvh; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center; flex-direction:column; padding:20px; box-sizing:border-box;">
    <div style="background:white; padding:30px; border-radius:25px; max-width:400px; width:100%; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        <div style="font-size:40px; text-align:center; margin-bottom:10px;">🛑</div>
        <h2 style="color:#ff4757; font-size:24px; font-weight:900; text-align:center; margin-top:0; margin-bottom:15px;">資料庫權限被阻擋！</h2>
        <p style="color:#2f3542; font-weight:bold; font-size:15px; line-height:1.6; margin-bottom:15px;">
            您的網站已成功連上 Firebase，但被<b>安全規則 (Rules)</b> 擋在門外了。<br><br>
            請親自前往 Firebase 控制台完成最後一步：
        </p>
        <div style="background:#f1f2f6; padding:15px; border-radius:15px; margin-bottom:20px;">
            <ol style="margin:0; padding-left:20px; color:#2f3542; font-size:14px; font-weight:bold; line-height:1.8;">
                <li>點擊左側 <b>Firestore Database</b></li>
                <li>點擊上方的 <b>規則 (Rules)</b> 標籤</li>
                <li>將代碼修改為下方<span style="color:#27ae60;">綠色框框</span>的內容</li>
                <li>點擊 <b>發布 (Publish)</b></li>
            </ol>
        </div>
        <div style="background:#e8fcf1; border:2px solid #2ed573; padding:15px; border-radius:15px; font-family:monospace; font-size:13px; color:#27ae60; font-weight:bold; overflow-x:auto;">
            rules_version = '2';<br>
            service cloud.firestore {<br>
            &nbsp;&nbsp;match /databases/{database}/documents {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;match /{document=**} {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;}<br>
            &nbsp;&nbsp;}<br>
            }
        </div>
        <button onclick="document.getElementById('firebaseSetupWizard').style.display='none'" style="margin-top:20px; width:100%; padding:15px; background:#2ed573; color:white; border:none; border-radius:15px; font-size:18px; font-weight:900; cursor:pointer; box-shadow:0 4px 0 #27ae60; transition:0.2s;">我知道了，我這就去改！</button>
    </div>
</div>

<div class="app-title" onclick="goHome()">Card Card Love</div>

<div class="main-wrapper">
    <!-- 首頁 -->
    <div id="homeUI" style="display: flex; flex-direction: column; align-items: center;">
        <div class="home-subtitle">今天你想來點什麼字卡?</div>
        <div class="btn-group">
            <button class="lang-btn btn-zhuyin" onclick="startApp('zhuyin')">ㄅ 注音符號</button>
            <button class="lang-btn btn-hiragana" onclick="startApp('hiragana')">あ 平假名</button>
            <button class="lang-btn btn-katakana" onclick="startApp('katakana')">ア 片假名</button>
            <button class="lang-btn btn-math" onclick="startApp('math')">📐 數學不卡卡</button>
        </div>
    </div>

    <!-- 精細單元選擇選單 -->
    <div id="unitSelectUI" class="unit-select-wrapper"></div>

    <!-- 結算與排行榜專屬版面 (新滿版版面) -->
    <div id="resultBoardUI" class="unit-select-wrapper" style="background-color: #f8f9fa;">
        <div style="width:95%; max-width:400px; display:flex; flex-direction:column; align-items:center; margin-top:20px;">
            <div style="font-size:45px; margin-bottom:10px;">🏆</div>
            <h2 style="font-size:28px; font-weight:900; color:#ff9f43; margin:0 0 5px 0;">挑戰完成！</h2>
            <div style="color:#a4b0be; font-weight:bold; margin-bottom:15px;">挑戰者：<span id="resultNameDisp" style="color:#2f3542;"></span></div>
            
            <div style="background:white; border-radius:25px; padding:20px; width:100%; box-shadow:0 8px 15px rgba(0,0,0,0.05); border:4px solid #f1f2f6; display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
                <span style="font-size:14px; font-weight:bold; color:#a4b0be; text-transform:uppercase; letter-spacing:1px;">Total Score</span>
                <div style="font-size:60px; font-weight:900; color:#4a148c; line-height:1.2;" id="finalScoreText">100</div>
                <span style="font-size:14px; font-weight:bold; color:#a4b0be;">分</span>
            </div>

            <div style="width:100%; background:white; border-radius:25px; padding:15px; box-shadow:0 8px 15px rgba(0,0,0,0.05); border:2px solid #f1f2f6; margin-bottom:20px; box-sizing: border-box;">
                <div id="leaderboardTitle" style="font-size:18px; font-weight:900; color:#e67e22; margin-bottom:12px; text-align:center; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>🌍</span> <span id="leaderboardTitleText">英雄榜</span>
                </div>
                <div id="leaderboardList" style="display:flex; flex-direction:column; gap:8px; max-height:35vh; overflow-y:auto; padding-right:5px;">
                    <div style="text-align:center; color:#999; font-size:14px;">載入榜單中...</div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; width:100%; padding-bottom:20px;">
                <button onclick="retryQuiz()" style="background:#ff9f43; color:white; padding:15px; border:none; border-radius:18px; font-weight:bold; cursor:pointer; font-size:16px; box-shadow:0 4px 0 #d35400; transition:0.2s;">🔄 重新測驗</button>
                <div style="display:flex; gap:10px;">
                    <button onclick="goBackToUnits()" style="flex:1; background:#dfe4ea; color:#2f3542; padding:15px; border:none; border-radius:18px; font-weight:bold; cursor:pointer; font-size:15px; box-shadow:0 4px 0 #ced6e0; transition:0.2s;">🔙 返回單元</button>
                    <button onclick="goHome()" style="flex:1; background:#fff; border:2px solid #dfe4ea; color:#2f3542; padding:15px; border-radius:18px; font-weight:bold; cursor:pointer; font-size:15px; box-shadow:0 4px 0 #f1f2f6; transition:0.2s;">🏠 返回首頁</button>
                </div>
            </div>
        </div>
    </div>

    <!-- 頂部工具列 -->
    <div class="top-bars" id="topBars">
        <div class="mode-switch">
            <button class="mode-btn" onclick="goBackToUnits()">🔙 返回</button>
            <button class="mode-btn" onclick="triggerTopShuffle()" style="color:#e67e22;">🔀 洗牌</button>
            <button class="mode-btn active" id="mLearn" onclick="setMode('learn')">📖 學習</button>
            <button class="mode-btn" id="mQuiz" onclick="setMode('quiz')">🎮 測驗</button>
        </div>
    </div>

    <!-- 字卡區 -->
    <div class="card" id="cardArea">
        <div id="learnView" onclick="handleCardClick()" style="display:flex; flex-direction:column; align-items:center; height:100%; justify-content:space-between; width:100%; cursor:pointer;" title="點擊可聆聽發音">
            <div class="main-sym" id="symDisp"></div>
            <!-- 新增羅馬拼音顯示區 -->
            <div id="romajiDisp" style="display:none; font-size: 32px; font-weight: 900; color: #ff9f43; font-family: 'Courier New', Courier, monospace; margin-top: -15px; margin-bottom: 5px;"></div>
            <div class="emoji" id="emoDisp"></div>
            <div class="word-box" id="wordDisp"></div>
        </div>

        <div id="quizStartView" class="quiz-view">
            <div style="font-size:45px;">🏆</div>
            <div style="font-weight:bold; margin-bottom:8px;">高手挑戰賽</div>
            <div style="display:flex; flex-direction:column; gap:8px; width:85%;">
                <select id="qLen" style="padding:10px; border-radius:10px; border:1px solid #ddd; text-align:center; font-weight:bold;">
                    <option value="5">挑戰 5 題</option>
                    <option value="10" selected>挑戰 10 題</option>
                    <option value="20">挑戰 20 題</option>
                    <option value="25">挑戰 25 題</option>
                    <option value="0">全範圍特訓</option>
                </select>
                <input type="text" id="playerNameInputStart" placeholder="輸入大名留念..." maxlength="10" style="padding:10px; border-radius:10px; border:2px solid #dfe4ea; text-align:center; font-weight:bold; font-size:16px;">
                <div style="display:flex; gap: 8px;">
                    <button onclick="startQuizWithName()" style="flex:2; background:#ff9f43; color:white; padding:12px; border:none; border-radius:15px; font-weight:bold; cursor:pointer;">🚀 開始測驗！</button>
                    <button onclick="startQuizSkipName()" style="flex:1; background:#dfe4ea; color:#2f3542; padding:12px; border:none; border-radius:15px; font-weight:bold; cursor:pointer;">略過 ⏭️</button>
                </div>
            </div>
        </div>

        <div id="quizPlayView" class="quiz-view">
            <div id="qStat" style="font-size:13px; font-weight:bold; color:#00a8ff; margin-bottom:5px;">第 1 題 | 目前得分: 0 分</div>
            <div style="font-size:40px; cursor:pointer; animation: bounce 2s infinite;" id="quizSoundBtn" onclick="playQuizVoice()">🔊</div>
            <div class="opt-grid" id="optGrid"></div>
        </div>
    </div>

    <!-- 下方控制 -->
    <div class="controls" id="learnCtrls">
        <button class="ctrl-btn btn-p" onclick="nav(-1)">◀ 上一張</button>
        <button class="ctrl-btn btn-s" id="soundBtn" onclick="handlePrimaryAction()">🔊 聽發音</button>
        <button class="ctrl-btn btn-p" onclick="nav(1)">下一張 ▶</button>
    </div>
    
    <div class="controls" id="quizCtrls">
        <button id="nextQBtn" style="display:none;" onclick="nextQuestion()">⭐ 下一題</button>
    </div>

    <div class="prog" id="progText" style="display:none; margin-top: 5px; font-size: 13px; color: #a4b0be; font-weight:bold;"></div>
</div>

<div class="app-footer">byKC v4.3 (Netlify正式雲端版)</div>

<!-- 你的原始應用程式邏輯 -->
<script>
// ==================== 基礎導覽機制 ====================
let currentPlayerName = '無名英雄';
let currentStreak = 0; // 記錄連續答對次數

// 新增：用來記錄現在是哪一個單元的變數
let currentBoardId = 'default';
let currentBoardName = '總榜單';

function getLangName(lang) {
    if (lang === 'zhuyin') return 'ㄅ 注音';
    if (lang === 'hiragana') return 'あ 平假名';
    if (lang === 'katakana') return 'ア 片假名';
    if (lang === 'math') return '📐 數學';
    return lang;
}

function goHome() {
    document.getElementById('unitSelectUI').style.display = 'none';
    document.getElementById('resultBoardUI').style.display = 'none';
    document.getElementById('topBars').style.display = 'none';
    document.getElementById('cardArea').style.display = 'none';
    document.getElementById('quizStartView').style.display = 'none';
    document.getElementById('quizPlayView').style.display = 'none';
    document.getElementById('homeUI').style.display = 'flex';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatQuadratic(a, b, c) {
    let terms = [];
    if (a === 1) terms.push("x²"); else if (a === -1) terms.push("-x²"); else if (a !== 0) terms.push(`${a}x²`);
    if (b === 1) terms.push("+ x"); else if (b === -1) terms.push("- x"); else if (b > 0) terms.push(`+ ${b}x`); else if (b < 0) terms.push(`- ${-b}x`);
    if (c > 0) terms.push(`+ ${c}`); else if (c < 0) terms.push(`- ${-c}`);
    let res = terms.join(" ");
    if (res.startsWith("+ ")) res = res.substring(2); 
    if (res.trim() === "") return "0";
    return res;
}

// ==================== 語言資料庫 (完整保留) ====================
const zhData = [
    {s:'ㄅ',e:'👨',w:'爸爸',z:'ㄅㄚˋ ㄅㄚ˙'}, {s:'ㄆ',e:'🍇',w:'葡萄',z:'ㄆㄨˊ ㄊㄠˊ'}, {s:'ㄇ',e:'🐱',w:'貓咪',z:'ㄇㄠ ㄇㄧ'}, {s:'ㄈ',e:'✈️',w:'飛機',z:'ㄈㄟ ㄐㄧ'},
    {s:'ㄉ',e:'🐘',w:'大象',z:'ㄉㄚˋ ㄒㄧㄤˋ'}, {s:'ㄊ',e:'🐰',w:'兔子',z:'ㄊㄨˋ ㄗ˙'}, {s:'ㄋ',e:'🥛',w:'牛奶',z:'ㄋㄧㄡˊ ㄋㄞˇ'}, {s:'ㄌ',e:'🐯',w:'老虎',z:'ㄌㄠˇ ㄏㄨˇ'},
    {s:'ㄍ',e:'🐶',w:'狗狗',z:'ㄍㄡˇ ㄍㄡ˙'}, {s:'ㄎ',e:'🦖',w:'恐龍',z:'ㄎㄨㄥˇ ㄌㄨㄥˊ'}, {s:'ㄏ',e:'🐒',w:'猴子',z:'ㄏㄡˊ ㄗ˙'}, {s:'ㄐ',e:'👮',w:'警察',z:'ㄐㄧㄥˇ ㄔㄚˊ'},
    {s:'ㄑ',e:'🐧',w:'企鵝',z:'ㄑㄧˋ ㄜˊ'}, {s:'ㄒ',e:'🍉',w:'西瓜',z:'ㄒㄧ ㄍㄨㄚ'}, {s:'ㄓ',e:'🕷️',w:'蜘蛛',z:'ㄓ ㄓㄨ'}, {s:'ㄔ',e:'🚗',w:'車子',z:'ㄔㄜ ㄗ˙'},
    {s:'ㄕ',e:'🦁',w:'獅子',z:'ㄕ ㄗ˙'}, {s:'ㄖ',e:'📅',w:'日曆',z:'ㄖˋ ㄌㄧˋ'}, {s:'ㄗ',e:'👄',w:'嘴巴',z:'ㄗㄨㄟˇ ㄅㄚ˙'}, {s:'ㄘ',e:'🍓',w:'草莓',z:'ㄘㄠˇ ㄇㄟˊ'},
    {s:'ㄙ',e:'🐿️',w:'松鼠',z:'ㄙㄨㄥ ㄕㄨˇ'}, {s:'ㄧ',e:'👕',w:'衣服',z:'ㄧ ㄈㄨˊ'}, {s:'ㄨ',e:'🐢',w:'烏龜',z:'ㄨ ㄍㄨㄟ'}, {s:'ㄩ',e:'☔',w:'雨傘',z:'ㄩˇ ㄙㄢˇ'},
    {s:'ㄚ',e:'🦆',w:'鴨子',z:'ㄧㄚ ㄗ˙'}, {s:'ㄛ',e:'👵',w:'婆婆',z:'ㄆㄛˊ ㄆㄛ˙'}, {s:'ㄜ',e:'🦢',w:'天鵝',z:'ㄊㄧㄢ ㄜˊ'}, {s:'ㄝ',e:'👞',w:'鞋子',z:'ㄒㄧㄝˊ ㄗ˙'},
    {s:'ㄞ',e:'❤️',w:'愛心',z:'ㄞˋ ㄒㄧㄣ'}, {s:'ㄟ',e:'🥤',w:'杯子',z:'ㄅㄟ ㄗ˙'}, {s:'ㄠ',e:'🧢',w:'帽子',z:'ㄇㄠˋ ㄗ˙'}, {s:'ㄡ',e:'🕊️',w:'海鷗',z:'ㄏㄞˇ ㄡ'},
    {s:'ㄢ',e:'🦓',w:'斑馬',z:'ㄅㄢ ㄇㄚˇ'}, {s:'ㄣ',e:'🌲',w:'森林',z:'ㄙㄣ ㄌㄧㄣˊ'}, {s:'ㄤ',e:'☀️',w:'太陽',z:'ㄊㄞˋ ㄧㄤˊ'}, {s:'ㄥ',e:'🐝',w:'蜜蜂',z:'ㄇㄧˋ ㄈㄥ'},
    {s:'ㄦ',e:'👂',w:'耳朵',z:'ㄦˇ ㄉㄨㄛ˙'}
];

const jpHiData = [
    {s:'あ',e:'🍬',w:'あめ',m:'糖果'}, {s:'い',e:'🐶',w:'いぬ',m:'狗'}, {s:'う',e:'🐄',w:'うし',m:'牛'}, {s:'え',e:'🚉',w:'えき',m:'車站'}, {s:'お',e:'🍙',w:'おにぎり',m:'飯糰'},
    {s:'か',e:'☂️',w:'かさ',m:'傘'}, {s:'き',e:'🌳',w:'き',m:'樹木'}, {s:'く',e:'👞',w:'くつ',m:'鞋子'}, {s:'け',e:'🐛',w:'けむし',m:'毛毛蟲'}, {s:'こ',e:'🪀',w:'こま',m:'陀螺'},
    {s:'さ',e:'🐒',w:'さる',m:'猴子'}, {s:'し',e:'🦌',w:'しか',m:'鹿'}, {s:'す',e:'🍉',w:'すいか',m:'西瓜'}, {s:'せ',e:'🐞',w:'せみ',m:'蟬'}, {s:'そ',e:'☁️',w:'そら',m:'天空'},
    {s:'た',e:'🐙',w:'たこ',m:'章魚'}, {s:'ち',e:'🦋',w:'ちょうちょ',m:'蝴蝶'}, {s:'つ',e:'🌙',w:'つき',m:'月亮'}, {s:'て',e:'✋',w:'て',m:'手'}, {s:'と',e:'⌚',w:'とけい',m:'手錶'},
    {s:'な',e:'🍆',w:'なす',m:'茄子'}, {s:'に',e:'🐔',w:'にわとり',m:'雞'}, {s:'ぬ',e:'🖍️',w:'ぬりえ',m:'塗鴉'}, {s:'ね',e:'🐱',w:'ねこ',m:'貓咪'}, {s:'の',e:'🌱',w:'のり',m:'海苔'},
    {s:'は',e:'🌸',w:'はな',m:'花'}, {s:'ひ',e:'✈️',w:'ひこうき',m:'飛機'}, {s:'ふ',e:'🚢',w:'ふね',m:'船'}, {s:'へ',e:'🐍',w:'へび',m:'蛇'}, {s:'ほ',e:'⭐',w:'ほし',m:'星星'},
    {s:'ま',e:'🪟',w:'まど',m:'窗戶'}, {s:'み',e:'🍊',w:'みかん',m:'橘子'}, {s:'む',e:'🐞',w:'むし',m:'蟲'}, {s:'め',e:'👓',w:'めがね',m:'眼鏡'}, {s:'も',e:'🍑',w:'もも',m:'桃子'},
    {s:'や',e:'⛰️',w:'やま',m:'山'}, {s:'ゆ',e:'❄️',w:'ゆき',m:'雪'}, {s:'よ',e:'🌃',w:'よる',m:'夜晚'}, {s:'ら',e:'🎺',w:'らっぱ',m:'喇叭'}, {s:'り',e:'🍎',w:'りんご',m:'蘋果'},
    {s:'る',e:'🏠',w:'るすばん',m:'看家'}, {s:'れ',e:'🧊',w:'れいぞうこ',m:'冰箱'}, {s:'ろ',e:'🕯️',w:'ろうそく',m:'蠟燭'}, {s:'わ',e:'🐊',w:'わに',m:'鱷魚'}, {s:'を',e:'💧',w:'を',m:'助詞'}, {s:'ん',e:'🍞',w:'ぱん',m:'麵包'}
];

const jpKaData = [
    {s:'ア',e:'🍦',w:'アイス',m:'冰淇淋'}, {s:'イ',e:'🎧',w:'イヤホン',m:'耳機'}, {s:'ウ',e:'🎸',w:'ウクレレ',m:'烏克麗麗'}, {s:'エ',e:'🛗',w:'エレベーター',m:'電梯'}, {s:'オ',e:'🍊',w:'オレンジ',m:'柳橙'},
    {s:'カ',e:'📷',w:'カメラ',m:'相機'}, {s:'キ',e:'🥝',w:'奇異果',m:'奇異果'}, {s:'ク',e:'🧁',w:'クリーム',m:'鮮奶油'}, {s:'ケ',e:'🍰',w:'ケーキ',m:'蛋糕'}, {s:'コ',e:'☕',w:'コーヒー',m:'咖啡'},
    {s:'サ',e:'🥪',w:'サンドイッチ',m:'三明治'}, {s:'シ',e:'👕',w:'シャツ',m:'襯衫'}, {s:'ス',e:'🍲',w:'スープ',m:'湯'}, {s:'セ',e:'🧶',w:'セーター',m:'毛衣'}, {s:'ソ',e:'🌭',w:'ソーセージ',m:'香腸'},
    {s:'タ',e:'🚕',w:'タクシー',m:'計程車'}, {s:'チ',e:'🧀',w:'チーズ',m:'起司'}, {s:'ツ',e:'🗺️',w:'ツアー',m:'旅行團'}, {s:'テ',e:'📺',w:'電視',m:'電視'}, {s:'ト',e:'🍅',w:'トマト',m:'番茄'},
    {s:'ナ',e:'🔪',w:'刀子',m:'刀子'}, {s:'ニ',e:'📰',w:'新聞',m:'新聞'}, {s:'ヌ',e:'🍜',w:'麵條',m:'麵條'}, {s:'ネ',e:'👔',w:'領帶',m:'領帶'}, {s:'ノ',e:'📓',w:'筆記本',m:'筆記本'},
    {s:'ハ',e:'🍔',w:'漢堡',m:'漢堡'}, {s:'ヒ',e:'♨️',w:'暖氣',m:'暖氣'}, {s:'フ',e:'🍴',w:'叉子',m:'叉子'}, {s:'ヘ',e:'🚁',w:'直升機',m:'直升機'}, {s:'ホ',e:'🏨',w:'飯店',m:'飯店'},
    {s:'マ',e:'🎤',w:'麥克風',m:'麥克風'}, {s:'ミ',e:'🥛',w:'牛奶',m:'牛奶'}, {s:'ム',e:'🎬',w:'電影',m:'電影'}, {s:'メ',e:'🍈',w:'哈密瓜',m:'哈密瓜'}, {s:'モ',e:'🛵',w:'馬達',m:'馬達'},
    {s:'ヤ',e:'🌴',w:'椰子',m:'椰子'}, {s:'ユ',e:'🥋',w:'制服',m:'制服'}, {s:'ヨ',e:'⛵',w:'遊艇',m:'遊艇'}, {s:'ラ',e:'🦁',w:'獅子',m:'獅子'}, {s:'リ',e:'🎀',w:'緞帶',m:'緞帶'},
    {s:'ル',e:'💎',w:'寶石',m:'寶石'}, {s:'レ',e:'🍋',w:'檸檬',m:'檸檬'}, {s:'ロ',e:'🤖',w:'機器人',m:'機器人'}, {s:'ワ',e:'🍷',w:'葡萄酒',m:'葡萄酒'}, {s:'ン',e:'🖊️',w:'筆',m:'筆'}
];

const mathData = [
  { volume: "第一冊", unit: "直線方程式", title: "直線斜率", front: { formula: "m = (y₂ - y₁) / (x₂ - x₁)", hint: "y變化量除以x變化量" }, variants: [{ question: "A(1, 2), B(3, 6) 的直線斜率為何？", options: ["2", "3", "4", "1"], correctAnswer: 0, explanation: "(6 - 2) / (3 - 1) = 2" }] },
  { volume: "第一冊", unit: "直線方程式", title: "點斜式", front: { formula: "y - y₁ = m(x - x₁)", hint: "已知一點與斜率" }, variants: [{ question: "過點 (2, 3) 且斜率為 4 的直線方程式？", options: ["y = 4x - 5", "y = 4x + 5", "y = 2x - 3", "y = 4x"], correctAnswer: 0, explanation: "y - 3 = 4(x - 2) ⮕ y = 4x - 5" }] },
  { volume: "第一冊", unit: "直線方程式", title: "平行斜率", front: { formula: "L₁ // L₂ ⇔ m₁ = m₂", hint: "兩平行線斜率相等" }, variants: [{ question: "若 L₁ 斜率為 3 且 L₁ // L₂，則 L₂ 斜率？", options: ["3", "-3", "1/3", "-1/3"], correctAnswer: 0, explanation: "平行線斜率相等" }] },
  { volume: "第一冊", unit: "直線方程式", title: "垂直斜率", front: { formula: "L₁ ⊥ L₂ ⇔ m₁ × m₂ = -1", hint: "兩垂直線斜率相乘為 -1" }, variants: [{ question: "若 L₁ 斜率為 2 且 L₁ ⊥ L₂，則 L₂ 斜率？", options: ["-1/2", "1/2", "2", "-2"], correctAnswer: 0, explanation: "垂直斜率相乘為 -1 ⮕ m₂ = -1/2" }] },
  { volume: "第一冊", unit: "坐標系與函數圖形", title: "兩點距離", front: { formula: "d = √((x₂-x₁)² + (y₂-y₁)²)", hint: "兩點直線距離" }, variants: [{ question: "A(-2, 1), B(4, 9) 距離為何？", options: ["8", "10", "12", "14"], correctAnswer: 1, explanation: "√(6² + 8²) = 10" }] },
  { volume: "第一冊", unit: "坐標系與函數圖形", title: "中點座標", front: { formula: "M = ((x₁+x₂)/2, (y₁+y₂)/2)", hint: "相加除以 2" }, variants: [{ question: "A(-3, 5), B(7, -1) 中點？", options: ["(4, 4)", "(2, 2)", "(-5, 3)", "(5, -3)"], correctAnswer: 1, explanation: "((-3+7)/2, (5-1)/2) = (2, 2)" }] },
  { volume: "第一冊", unit: "坐標系與函數圖形", title: "重心座標", front: { formula: "G = (Σx/3, Σy/3)", hint: "三個頂點相加除以 3" }, variants: [{ question: "頂點 (0,0), (6,0), (3,9) 重心？", options: ["(3, 4)", "(3, 3)", "(4, 3)", "(2, 2)"], correctAnswer: 1, explanation: "((0+6+3)/3, (0+0+9)/3) = (3, 3)" }] },
  { volume: "第一冊", unit: "坐標系與函數圖形", title: "內分點公式", front: { formula: "P = (n·P₁ + m·P₂) / (m+n)", hint: "交叉相乘再相加" }, variants: [{ question: "A(-3), B(7)，P 在 AB 且 AP:PB=2:3，P=?", options: ["0", "1", "2", "3"], correctAnswer: 1, explanation: "(3*(-3) + 2*7)/5 = 1" }] },
  { volume: "第一冊", unit: "坐標系與函數圖形", title: "二次函數頂點", front: { formula: "x = -b / 2a", hint: "拋物線對稱軸" }, variants: [{ question: "y = x² - 6x + 10 的頂點 x 座標？", options: ["-3", "3", "6", "-6"], correctAnswer: 1, explanation: "x = -(-6) / 2 = 3" }] },
  { volume: "第一冊", unit: "三角函數", title: "弳度轉換", front: { formula: "180° = π (rad)", hint: "度數換弧度乘 π/180" }, variants: [{ question: "120° 等於多少弧度？", options: ["π/3", "2π/3", "3π/4", "5π/6"], correctAnswer: 1, explanation: "120 * (π/180) = 2π/3" }] },
  { volume: "第一冊", unit: "三角函數", title: "特殊角", front: { formula: "sin 30° = 1/2", hint: "cos 60° 也是 1/2" }, variants: [{ question: "sin 45° + cos 45° = ?", options: ["1", "√2", "√3", "2"], correctAnswer: 1, explanation: "√2/2 + √2/2 = √2" }] },
  { volume: "第一冊", unit: "三角函數", title: "平方關係", front: { formula: "sin²θ + cos²θ = 1", hint: "核心恆等式" }, variants: [{ question: "若 sin θ = 0.6，則 cos²θ = ?", options: ["0.36", "0.64", "0.8", "0.4"], correctAnswer: 1, explanation: "1 - 0.6² = 1 - 0.36 = 0.64" }] },
  { volume: "第一冊", unit: "三角函數", title: "扇形弧長", front: { formula: "s = rθ", hint: "θ 須為弧度" }, variants: [{ question: "半徑 8，中心角 2 弧度的弧長？", options: ["10", "16", "32", "4"], correctAnswer: 1, explanation: "s = 8 * 2 = 16" }] },
  { volume: "第一冊", unit: "三角函數", title: "商數關係", front: { formula: "tan θ = sin θ / cos θ", hint: "斜率即為 tan" }, variants: [{ question: "sin θ=8/17, cos θ=15/17，tan θ=?", options: ["15/8", "8/15", "8/17", "1"], correctAnswer: 1, explanation: "(8/17) / (15/17) = 8/15" }] },
  { volume: "第一冊", unit: "平面向量", title: "向量長度", front: { formula: "|v| = √(x² + y²)", hint: "座標平方和開根號" }, variants: [{ question: "向量 (5, 12) 的長度？", options: ["11", "13", "15", "17"], correctAnswer: 1, explanation: "√(5² + 12²) = 13" }] },
  { volume: "第一冊", unit: "平面向量", title: "向量垂直", front: { formula: "u · v = 0", hint: "內積等於 0 代表垂直" }, variants: [{ question: "u=(3, 4), v=(k, -6) 垂直，k=?", options: ["6", "8", "10", "12"], correctAnswer: 1, explanation: "3k - 24 = 0 ⮕ k=8" }] },
  { volume: "第一冊", unit: "平面向量", title: "向量內積", front: { formula: "u · v = x₁x₂ + y₁y₂", hint: "分量相乘再相加" }, variants: [{ question: "u=(2, -3), v=(4, 5)，內積？", options: ["-7", "-5", "7", "23"], correctAnswer: 0, explanation: "8 + (-15) = -7" }] },
  { volume: "第一冊", unit: "平面向量", title: "向量平行", front: { formula: "x₁/x₂ = y₁/y₂", hint: "分量成比例" }, variants: [{ question: "u=(2, k), v=(6, 15) 平行，k=?", options: ["3", "4", "5", "6"], correctAnswer: 2, explanation: "2/6 = k/15 ⮕ k=5" }] },
  { volume: "第一冊", unit: "平面向量", title: "單位向量", front: { formula: "u = v / |v|", hint: "向量除以自己的長度" }, variants: [{ question: "向量 (6, 8) 的單位向量？", options: ["(0.8, 0.6)", "(0.6, 0.8)", "(3, 4)", "(1, 1)"], correctAnswer: 1, explanation: "長度 10 ⮕ (6/10, 8/10)" }] },
  
  { volume: "第二冊", unit: "式的運算", title: "餘式定理", front: { formula: "f(a) = r", hint: "除以 (x-a) 的餘式為 f(a)" }, variants: [{ question: "f(x)=x³-3x²+5 除以 x-2 的餘式？", options: ["1", "3", "5", "9"], correctAnswer: 0, explanation: "f(2) = 8 - 12 + 5 = 1" }] },
  { volume: "第二冊", unit: "式的運算", title: "因式定理", front: { formula: "f(a)=0 ⇔ (x-a) 是因式", hint: "代入後等於 0 代表整除" }, variants: [{ question: "若 x-4 為 f(x) 因式，必有？", options: ["f(4)=0", "f(-4)=0", "f(0)=4", "f(4)=4"], correctAnswer: 0, explanation: "整除代表 f(4) = 0" }] },
  { volume: "第二冊", unit: "式的運算", title: "平方差公式", front: { formula: "a² - b² = (a+b)(a-b)", hint: "常用分解" }, variants: [{ question: "16x² - 9 分解為？", options: ["(4x-3)²", "(16x-9)(16x+9)", "(4x+3)(4x-3)", "(4x-9)"], correctAnswer: 2, explanation: "(4x)² - 3² = (4x+3)(4x-3)" }] },
  { volume: "第二冊", unit: "式的運算", title: "立方和", front: { formula: "a³+b³ = (a+b)(a²-ab+b²)", hint: "中間項是減號" }, variants: [{ question: "x³ + 27 分解包含？", options: ["x-3", "x²+3x+9", "x²-3x+9", "(x+3)³"], correctAnswer: 2, explanation: "x³ + 3³ = (x+3)(x²-3x+9)" }] },
  { volume: "第二冊", unit: "式的運算", title: "雙重根號", front: { formula: "√(A ± 2√B)", hint: "相加 A，相乘 B" }, variants: [{ question: "√(6 - 2√8) = ?", options: ["√4+√2", "2-√2", "√6-√8", "3-√2"], correctAnswer: 1, explanation: "4+2=6, 4*2=8 ⮕ √4 - √2 = 2 - √2" }] },
  { volume: "第二冊", unit: "直線與圓", title: "點到直線距離", front: { formula: "d = |ax₀+by₀+c| / √(a²+b²)", hint: "代入點，除以法向量長" }, variants: [{ question: "(1,1) 到 3x-4y+12=0 距離？", options: ["11/5", "2", "3", "12/5"], correctAnswer: 0, explanation: "|3-4+12| / √(3²+(-4)²) = 11/5" }] },
  { volume: "第二冊", unit: "直線與圓", title: "兩平行線距離", front: { formula: "d = |c₁-c₂| / √(a²+b²)", hint: "常數項相減除以根號" }, variants: [{ question: "3x+4y-2=0 與 3x+4y+8=0 距離？", options: ["1", "2", "3", "4"], correctAnswer: 1, explanation: "|8 - (-2)| / 5 = 10/5 = 2" }] },
  { volume: "第二冊", unit: "直線與圓", title: "圓心與半徑", front: { formula: "x²+y²+dx+ey+f=0", hint: "圓心(-d/2, -e/2)" }, variants: [{ question: "x²+y²-6x+8y=0 的圓心？", options: ["(3, -4)", "(-3, 4)", "(6, -8)", "(-6, 8)"], correctAnswer: 0, explanation: "x項除-2得3，y項除-2得-4" }] },
  { volume: "第二冊", unit: "直線與圓", title: "圓標準式", front: { formula: "(x-h)²+(y-k)²=r²", hint: "圓心(h,k)，半徑r" }, variants: [{ question: "圓心(2,-3)半徑4的圓方程式？", options: ["(x-2)²+(y+3)²=4", "(x-2)²+(y+3)²=16", "(x+2)²+(y-3)²=16", "(x-2)²+(y-3)²=16"], correctAnswer: 1, explanation: "(x-2)² + (y-(-3))² = 4²" }] },
  { volume: "第二冊", unit: "直線與圓", title: "切線段長", front: { formula: "t = √((x₀-h)²+(y₀-k)²-r²)", hint: "點代入圓方程式開根號" }, variants: [{ question: "點(4,5) 到 x²+y²=16 的切線段長？", options: ["3", "4", "5", "25"], correctAnswer: 2, explanation: "√(16 + 25 - 16) = √25 = 5" }] },
  { volume: "第二冊", unit: "不等式", title: "二次不等式", front: { formula: "(x-α)(x-β) < 0", hint: "小於在兩根之間，大於在兩根之外" }, variants: [{ question: "解不等式：x² - 3x + 2 < 0", options: ["1 < x < 2", "x < 1 或 x > 2", "-1 < x < 2", "x < -2 或 x > -1"], correctAnswer: 0, explanation: "(x-1)(x-2) < 0 ⮕ 1 < x < 2" }] },
  { volume: "第二冊", unit: "數列與級數", title: "等差第n項", front: { formula: "a_n = a₁ + (n-1)d", hint: "公差加 (n-1) 次" }, variants: [{ question: "a₁=3, d=5, a₈=?", options: ["33", "38", "43", "48"], correctAnswer: 1, explanation: "3 + 7*5 = 38" }] },
  { volume: "第二冊", unit: "數列與級數", title: "等差求和", front: { formula: "S_n = n(a₁+a_n)/2", hint: "梯形公式：(上+下)*高/2" }, variants: [{ question: "首項4，末項16，共7項，總和？", options: ["60", "70", "80", "90"], correctAnswer: 1, explanation: "7*(4+16)/2 = 70" }] },
  { volume: "第二冊", unit: "數列與級數", title: "等比第n項", front: { formula: "a_n = a₁ × rⁿ⁻¹", hint: "公比乘 (n-1) 次" }, variants: [{ question: "a₁=3, r=2, a₅=?", options: ["24", "48", "96", "192"], correctAnswer: 1, explanation: "3 * 2⁴ = 3 * 16 = 48" }] },
  { volume: "第二冊", unit: "數列與級數", title: "無窮等比級數", front: { formula: "S = a₁ / (1-r)", hint: "收斂條件 |r| < 1" }, variants: [{ question: "2 + 1 + 1/2 + ... 總和？", options: ["3.5", "4", "4.5", "無限大"], correctAnswer: 1, explanation: "2 / (1 - 1/2) = 4" }] },
  { volume: "第二冊", unit: "數列與級數", title: "Σ 運算性質", front: { formula: "Σ c = n×c", hint: "常數加 n 次" }, variants: [{ question: "Σ(k=1 to 15) 4 = ?", options: ["15", "19", "60", "64"], correctAnswer: 2, explanation: "15 * 4 = 60" }] },
  { volume: "第二冊", unit: "統計", title: "算術平均數", front: { formula: "μ = (Σx) / n", hint: "總和除以個數" }, variants: [{ question: "五個數據：60, 70, 80, 90, 100 的平均數？", options: ["80", "70", "75", "85"], correctAnswer: 0, explanation: "400 / 5 = 80" }] },
  
  { volume: "第三冊", unit: "排列組合", title: "直線排列", front: { formula: "P(n, m) = n! / (n-m)!", hint: "排順序" }, variants: [{ question: "6人排成一列有幾種？", options: ["120", "360", "720", "1440"], correctAnswer: 2, explanation: "6! = 720" }] },
  { volume: "第三冊", unit: "排列組合", title: "不盡相異物", front: { formula: "n! / (p!q!)", hint: "同類物除以階乘" }, variants: [{ question: "AAABB 五字母排列？", options: ["5", "10", "20", "120"], correctAnswer: 1, explanation: "5! / (3!2!) = 10" }] },
  { volume: "第三冊", unit: "排列組合", title: "組合 C", front: { formula: "C(n, m) = n! / (m!(n-m)!)", hint: "不排順序" }, variants: [{ question: "8人中選2人？", options: ["16", "28", "56", "64"], correctAnswer: 1, explanation: "(8*7)/(2*1) = 28" }] },
  { volume: "第三冊", unit: "排列組合", title: "重複組合 H", front: { formula: "H(n, m) = C(n+m-1, m)", hint: "不同種類選 m 個" }, variants: [{ question: "4種飲料任選2杯？", options: ["6", "8", "10", "12"], correctAnswer: 2, explanation: "H(4,2) = C(5,2) = 10" }] },
  { volume: "第三冊", unit: "排列組合", title: "二項式定理", front: { formula: "C(n, r) a^(n-r) b^r", hint: "找特定次方係數" }, variants: [{ question: "(x+2)⁴ 中 x³ 的係數？", options: ["4", "8", "16", "32"], correctAnswer: 1, explanation: "C(4,1) * x³ * 2¹ = 8" }] },
  { volume: "第三冊", unit: "機率", title: "數學期望值", front: { formula: "E = Σ (pᵢ × mᵢ)", hint: "機率乘上報酬的總和" }, variants: [{ question: "擲一骰子，出現奇數得 10 元，偶數得 20 元，期望值為？", options: ["15", "10", "20", "30"], correctAnswer: 0, explanation: "(1/2)*10 + (1/2)*20 = 15" }] },
  { volume: "第三冊", unit: "三角函數的應用", title: "三角形面積", front: { formula: "Area = 1/2 ab sinC", hint: "兩邊一夾角" }, variants: [{ question: "a=5, b=6, ∠C=30°，面積？", options: ["7.5", "15", "15√3", "30"], correctAnswer: 0, explanation: "1/2 * 5 * 6 * 0.5 = 7.5" }] },
  { volume: "第三冊", unit: "三角函數的應用", title: "正弦定理", front: { formula: "a / sinA = 2R", hint: "對邊對角，R為外接圓" }, variants: [{ question: "a=8, ∠A=45°，R=?", options: ["4", "4√2", "8", "8√2"], correctAnswer: 1, explanation: "8 / (1/√2) = 8√2 = 2R ⮕ R=4√2" }] },
  { volume: "第三冊", unit: "三角函數的應用", title: "餘弦定理", front: { formula: "c² = a² + b² - 2ab cosC", hint: "已知兩邊一夾角求第三邊" }, variants: [{ question: "a=4, b=6, ∠C=60°，c=?", options: ["√28", "√52", "6", "√76"], correctAnswer: 0, explanation: "16+36 - 2*24*(0.5) = 28" }] },
  { volume: "第三冊", unit: "三角函數的應用", title: "海龍公式", front: { formula: "Area = √s(s-a)(s-b)(s-c)", hint: "s = (a+b+c)/2" }, variants: [{ question: "三邊長 6, 8, 10，面積？", options: ["20", "24", "30", "48"], correctAnswer: 1, explanation: "s=12, √(12*6*4*2) = 24" }] },
  { volume: "第三冊", unit: "三角函數的應用", title: "二倍角公式", front: { formula: "sin 2θ = 2 sinθ cosθ", hint: "化簡常用" }, variants: [{ question: "sinθ=4/5 (銳角)，sin 2θ=?", options: ["8/5", "12/25", "24/25", "1"], correctAnswer: 2, explanation: "2 * (4/5) * (3/5) = 24/25" }] },
  { volume: "第三冊", unit: "指數與對數", title: "對數定義", front: { formula: "logₐ b = x ⇔ aˣ = b", hint: "底數不變" }, variants: [{ question: "log₂ 64 = ?", options: ["5", "6", "8", "32"], correctAnswer: 1, explanation: "2⁶ = 64" }] },
  { volume: "第三冊", unit: "指數與對數", title: "對數相加", front: { formula: "log M + log N = log(MN)", hint: "真數相乘" }, variants: [{ question: "log₄ 2 + log₄ 8 = ?", options: ["log₄ 10", "2", "16", "4"], correctAnswer: 1, explanation: "log₄ 16 = 2" }] },
  { volume: "第三冊", unit: "指數與對數", title: "換底公式", front: { formula: "logₐ b = (log b) / (log a)", hint: "變換底數" }, variants: [{ question: "log₉ 27 = ?", options: ["3", "1.5", "2", "1"], correctAnswer: 1, explanation: "(log 3³) / (log 3²) = 3/2 = 1.5" }] },
  { volume: "第三冊", unit: "指數與對數", title: "指數律", front: { formula: "a⁻ⁿ = 1 / aⁿ", hint: "負次方代表倒數" }, variants: [{ question: "4⁻² = ?", options: ["-8", "-16", "1/8", "1/16"], correctAnswer: 3, explanation: "1 / 4² = 1/16" }] },
  { volume: "第三冊", unit: "指數與對數", title: "對數次方", front: { formula: "log Mᵏ = k log M", hint: "提係數" }, variants: [{ question: "log 100000 = ?", options: ["4", "5", "6", "10"], correctAnswer: 1, explanation: "log 10⁵ = 5" }] },

  { volume: "第四冊", unit: "空間向量", title: "空間兩點距離", front: { formula: "d = √(Δx² + Δy² + Δz²)", hint: "三維的畢氏定理" }, variants: [{ question: "(1,2,2) 到 (3,5,8) 距離？", options: ["5", "7", "9", "11"], correctAnswer: 1, explanation: "√(4+9+36) = √49 = 7" }] },
  { volume: "第四冊", unit: "空間向量", title: "空間內積", front: { formula: "u · v = x₁x₂ + y₁y₂ + z₁z₂", hint: "各分量相乘再加總" }, variants: [{ question: "u=(2,1,-1), v=(3,0,4) 內積？", options: ["2", "4", "6", "8"], correctAnswer: 0, explanation: "6 + 0 - 4 = 2" }] },
  { volume: "第四冊", unit: "空間向量", title: "空間垂直", front: { formula: "u · v = 0", hint: "空間中內積為 0 一樣是垂直" }, variants: [{ question: "u=(k,2,3), v=(1,-1,2) 垂直，k=?", options: ["-4", "-2", "2", "4"], correctAnswer: 0, explanation: "k - 2 + 6 = 0 ⮕ k=-4" }] },
  { volume: "第四冊", unit: "空間向量", title: "空間平行", front: { formula: "x₁/x₂ = y₁/y₂ = z₁/z₂", hint: "所有分量成比例" }, variants: [{ question: "u=(1,k,4), v=(2,6,8) 平行，k=?", options: ["1", "2", "3", "4"], correctAnswer: 2, explanation: "1/2 = k/6 ⮕ k=3" }] },
  { volume: "第四冊", unit: "空間向量", title: "外積求面積", front: { formula: "Area = |u × v|", hint: "外積向量長度即為平行四邊形面積" }, variants: [{ question: "若外積向量為 (3, 4, 12)，則圍成面積？", options: ["7", "13", "17", "19"], correctAnswer: 1, explanation: "√(9+16+144) = 13" }] },
  { volume: "第四冊", unit: "一次聯立方程式與矩陣", title: "二階行列式", front: { formula: "|a b| \n|c d| = ad - bc", hint: "主對角乘積減副對角乘積" }, variants: [{ question: "第一列(4, 3), 第二列(2, 5) 的行列式？", options: ["10", "14", "20", "26"], correctAnswer: 1, explanation: "4*5 - 3*2 = 14" }] },
  { volume: "第四冊", unit: "一次聯立方程式與矩陣", title: "矩陣加法", front: { formula: "A + B", hint: "對應位置直接相加" }, variants: [{ question: "[2, -1] + [4, 5] = ?", options: ["(6, 4)", "(6, 6)", "(8, -5)", "(2, 6)"], correctAnswer: 0, explanation: "[2+4, -1+5] = [6, 4]" }] },
  { volume: "第四冊", unit: "一次聯立方程式與矩陣", title: "矩陣係積積", front: { formula: "k · A", hint: "每個元素都要乘上 k" }, variants: [{ question: "若 A=[1, -2]，則 4A = ?", options: ["(4, -2)", "(1, -8)", "(4, -8)", "(5, 2)"], correctAnswer: 2, explanation: "[4*1, 4*(-2)] = [4, -8]" }] },
  { volume: "第四冊", unit: "一次聯立方程式與矩陣", title: "克拉瑪公式", front: { formula: "x = Δx / Δ", hint: "聯立方程解" }, variants: [{ question: "若 Δ=4, Δx=12，則 x=?", options: ["3", "8", "16", "48"], correctAnswer: 0, explanation: "12 / 4 = 3" }] },
  { volume: "第四冊", unit: "一次聯立方程式與矩陣", title: "克拉瑪無解", front: { formula: "Δ=0 且 (Δx≠0 或 Δy≠0)", hint: "分母為0且分子不為0" }, variants: [{ question: "若 Δ=0, Δx=3，則聯立方程式？", options: ["唯一解", "無限多組解", "無解", "無法判斷"], correctAnswer: 2, explanation: "3/0 無意義 ⮕ 無解" }] },
  { volume: "第四冊", unit: "二元一次不等式與線性規劃", title: "半平面判斷", front: { formula: "ax+by+c > 0 (a>0)", hint: "x係數為正時，>0 在右側" }, variants: [{ question: "4x - y + 2 > 0 的圖形在直線的哪一側？", options: ["左側", "右側", "上方", "下方"], correctAnswer: 1, explanation: "x 係數為正，大於 0 在右側" }] },
  { volume: "第四冊", unit: "二元一次不等式與線性規劃", title: "同側異側", front: { formula: "L(A) × L(B) < 0", hint: "代入值一正一負代表在異側" }, variants: [{ question: "A點代入L得4，B點代入得5，兩點？", options: ["同側", "異側", "直線上", "無法判斷"], correctAnswer: 0, explanation: "4*5 > 0 ⮕ 同側" }] },
  { volume: "第四冊", unit: "二元一次不等式與線性規劃", title: "極值發生點", front: { formula: "極值必發生在多邊形頂點", hint: "頂點代入目標函數" }, variants: [{ question: "f(x,y)=2x+3y，頂點為(0,0),(2,0),(0,2)，最大值？", options: ["0", "4", "6", "8"], correctAnswer: 2, explanation: "(0,2) 代入得 6 最大" }] },
  { volume: "第四冊", unit: "二元一次不等式與線性規劃", title: "第一象限限制", front: { formula: "x ≥ 0, y ≥ 0", hint: "代表圖形被限制在第一象限" }, variants: [{ question: "若條件包含 x≤0, y≤0，則可行解在？", options: ["第一象限", "第二象限", "第三象限", "第四象限"], correctAnswer: 2, explanation: "x, y 皆負為第三象限" }] },
  { volume: "第四冊", unit: "二元一次不等式與線性規劃", title: "聯立不等式交集", front: { formula: "滿足所有條件的區域", hint: "即可行解區域" }, variants: [{ question: "滿足 x+y≤3 且 x,y≥0 的區域形狀？", options: ["矩形", "三角形", "無限大區域", "圓形"], correctAnswer: 1, explanation: "由 (3,0), (0,3), (0,0) 圍成的三角形" }] },
  { volume: "第四冊", unit: "二次曲線", title: "拋物線焦點", front: { formula: "x² = 4cy", hint: "焦點 F(0, c)" }, variants: [{ question: "x² = 16y 的焦點座標為何？", options: ["(4, 0)", "(0, 4)", "(0, -4)", "(16, 0)"], correctAnswer: 1, explanation: "4c = 16 ⮕ c = 4 ⮕ 焦點 (0, 4)" }] },
  { volume: "第四冊", unit: "二次曲線", title: "拋物線正焦弦", front: { formula: "長度 = |4c|", hint: "通過焦點且垂直對稱軸的弦" }, variants: [{ question: "y² = 12x 的正焦弦長？", options: ["3", "-3", "12", "24"], correctAnswer: 2, explanation: "長度必為正，|12| = 12" }] },
  { volume: "第四冊", unit: "二次曲線", title: "橢圓長短軸", front: { formula: "x²/a² + y²/b² = 1", hint: "大分母為 a²，長軸=2a，短軸=2b" }, variants: [{ question: "x²/36 + y²/16 = 1，長軸長度為何？", options: ["6", "8", "12", "20"], correctAnswer: 2, explanation: "a²=36 ⮕ a=6 ⮕ 長軸 2a = 12" }] },
  { volume: "第四冊", unit: "二次曲線", title: "橢圓焦點關係", front: { formula: "a² = b² + c²", hint: "與畢氏定理類似，但 a 最大" }, variants: [{ question: "橢圓 a=10, b=6，焦點距離中心 c=?", options: ["4", "8", "16", "64"], correctAnswer: 1, explanation: "100 = 36 + c² ⮕ c²=64 ⮕ c=8" }] },
  { volume: "第四冊", unit: "二次曲線", title: "雙曲線漸近線", front: { formula: "x²/a² - y²/b² = 1", hint: "把 1 換成 0 就是漸近線方程式" }, variants: [{ question: "x²/16 - y²/9 = 1 的漸近線為？", options: ["4x±3y=0", "3x±4y=0", "16x±9y=0", "9x±16y=0"], correctAnswer: 1, explanation: "x²/16 - y²/9 = 0 ⮕ x/4 = ±y/3 ⮕ 3x±4y=0" }] },
  { volume: "第四冊", unit: "微分", title: "多項式微分", front: { formula: "(xⁿ)' = nxⁿ⁻¹", hint: "次方拿下來當係數，次方減 1" }, variants: [{ question: "f(x) = x³ - 5x 的導數？", options: ["3x² - 5", "3x² - 5x", "x² - 5", "3x³ - 5"], correctAnswer: 0, explanation: "3x² - 5" }] },
  { volume: "第四冊", unit: "微分", title: "常數微分", front: { formula: "(c)' = 0", hint: "常數微分為 0" }, variants: [{ question: "f(x) = 100，則 f'(8) = ?", options: ["100", "8", "0", "1"], correctAnswer: 2, explanation: "常數微分為 0" }] },
  { volume: "第四冊", unit: "微分", title: "微分加減法", front: { formula: "(f+g)' = f' + g'", hint: "分別微分再相加" }, variants: [{ question: "f(x) = 4x² - 3x，則 f'(x) = ?", options: ["8x", "8x - 3", "4x - 3", "8x² - 3"], correctAnswer: 1, explanation: "4(2x) - 3 = 8x - 3" }] },
  { volume: "第四冊", unit: "微分", title: "切線斜率", front: { formula: "m = f'(a)", hint: "幾何意義" }, variants: [{ question: "y = x² + 2x 在點 (1, 3) 的切線斜率？", options: ["3", "4", "5", "6"], correctAnswer: 1, explanation: "y' = 2x + 2，代入 x=1 ⮕ 4" }] },
  { volume: "第四冊", unit: "微分", title: "微分乘法", front: { formula: "f'g + fg'", hint: "可先展開再微分" }, variants: [{ question: "f(x) = x²(x-2) 的導數？", options: ["3x² - 4", "3x² - 4x", "2x(x-2)", "x² - 4x"], correctAnswer: 1, explanation: "展開為 x³ - 2x² ⮕ 3x² - 4x" }] },
  { volume: "第四冊", unit: "微分", title: "圖形凹向", front: { formula: "f''(x) > 0 凹向上", hint: "二階導數判斷凹口方向" }, variants: [{ question: "若 f''(x) > 0 恆成立，則圖形凹向為何？", options: ["凹向上", "凹向下", "不一定", "直線"], correctAnswer: 0, explanation: "二階導數大於 0 表示凹口向上" }] },
  { volume: "第四冊", unit: "微分", title: "極值判斷", front: { formula: "f'(c)=0 且 f''(c)<0", hint: "一階為0，二階為負，有極大值" }, variants: [{ question: "若 f'(c)=0 且 f''(c)<0，則 f(c) 為？", options: ["極大值", "極小值", "反曲點", "最小值"], correctAnswer: 0, explanation: "凹口向下，頂點為極大值" }] },
  { volume: "第四冊", unit: "積分", title: "多項式積分", front: { formula: "∫xⁿ dx = (1/(n+1))xⁿ⁺¹ + C", hint: "次方加 1，再除以新次方" }, variants: [{ question: "∫ 6x² dx = ?", options: ["2x³ + C", "12x + C", "6x³ + C", "3x³ + C"], correctAnswer: 0, explanation: "6 * (1/3)x³ = 2x³ + C" }] },
  { volume: "第四冊", unit: "積分", title: "常數積分", front: { formula: "∫ k dx = kx + C", hint: "補上 x" }, variants: [{ question: "∫ 4 dx = ?", options: ["4x + C", "4 + C", "0", "4x² + C"], correctAnswer: 0, explanation: "4x + C" }] },
  { volume: "第四冊", unit: "積分", title: "定積分定義", front: { formula: "∫ₐᵇ f(x)dx = F(b) - F(a)", hint: "上界代入減下界代入" }, variants: [{ question: "∫₀² 3x² dx = ?", options: ["4", "6", "8", "12"], correctAnswer: 2, explanation: "[x³]₀² = 8 - 0 = 8" }] },
  { volume: "第四冊", unit: "積分", title: "積分線性", front: { formula: "∫(f+g) = ∫f + ∫g", hint: "分開積再相加" }, variants: [{ question: "∫(4x - 1) dx = ?", options: ["2x² - x + C", "4x² - x + C", "2x² - 1 + C", "4 + C"], correctAnswer: 0, explanation: "2x² - x + C" }] },
  { volume: "第四冊", unit: "積分", title: "積分面積", front: { formula: "A = ∫ₐᵇ f(x) dx", hint: "面積幾何意義" }, variants: [{ question: "y=2x 在 x=0 到 4 面積？", options: ["8", "12", "16", "32"], correctAnswer: 2, explanation: "∫₀⁴ 2x dx = [x²]₀⁴ = 16" }] }
];

let fullData = [], curData = [], curLang = '', curIdx = 0, curMode = 'learn';
let quizPool = [], quizIdx = 0, quizMax = 0;
let totalScore = 0, currentQuestionAttempts = 0, curQ = null;
let mathFormulaVisible = false;
let currentQuizLen = 10;

// 🔥 升級：動態記錄目前所在的單元 ID，用來獨立顯示排行榜
let currentBoardId = 'default';
let currentBoardName = '總榜單';

function getLangName(lang) {
    if (lang === 'zhuyin') return 'ㄅ 注音';
    if (lang === 'hiragana') return 'あ 平假名';
    if (lang === 'katakana') return 'ア 片假名';
    if (lang === 'math') return '📐 數學';
    return lang;
}

const praises = ["太棒了！", "你真是背東西高手！", "你好厲害呀！", "很好哦，繼續努力！", "做得太好囉！"];

// 建立羅馬拼音對照表
const romajiMap = {
    'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o',
    'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
    'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so',
    'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
    'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
    'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
    'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
    'や':'ya', 'ゆ':'yu', 'よ':'yo',
    'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
    'わ':'wa', 'を':'wo', 'ん':'n',
    'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o',
    'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko',
    'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so',
    'タ':'ta', 'チ':'chi', 'ツ':'tsu', 'テ':'te', 'ト':'to',
    'ナ':'na', 'ニ':'ni', 'ヌ':'nu', 'ネ':'ne', 'ノ':'no',
    'ハ':'ha', 'ヒ':'hi', 'フ':'fu', 'ヘ':'he', 'ホ':'ho',
    'マ':'ma', 'ミ':'mi', 'ム':'mu', 'メ':'me', 'モ':'mo',
    'ヤ':'ya', 'ユ':'yu', 'ヨ':'yo',
    'ラ':'ra', 'リ':'ri', 'ル':'ru', 'レ':'re', 'ロ':'ro',
    'ワ':'wa', 'ン':'n'
};

// 🔥 完整修復：所有單元皆有動態亂數出題的超級數學引擎 🔥
function generateDynamicMathVariant(topic) {
    const M = {
        r: (min, max) => Math.floor(Math.random()*(max-min+1)+min),
        p: (arr) => arr[Math.floor(Math.random()*arr.length)],
        s: (ans, ...wrongs) => {
            let opts = [ans, ...wrongs].map(String);
            opts = [...new Set(opts)]; 
            while(opts.length < 4) {
                let num = parseFloat(ans);
                if(isNaN(num)) opts.push(String(M.r(1, 20)));
                else opts.push(String(num + M.r(-5, 5)));
                opts = [...new Set(opts)];
            }
            opts.sort(() => Math.random() - 0.5); 
            return { options: opts, correctAnswer: opts.indexOf(String(ans)) };
        }
    };
    const t = topic.title;

    try {
        if(t === "直線斜率") {
            let x1 = M.r(-3, 3), y1 = M.r(-3, 3), dx = M.p([1, 2, 3, 4]), m = M.r(-3, 3);
            let x2 = x1 + dx, y2 = y1 + m * dx;
            return { question: `A(${x1}, ${y1}), B(${x2}, ${y2}) 的直線斜率為何？`, ...M.s(m, m+1, m-1, m+2), explanation: `(${y2} - (${y1})) / (${x2} - (${x1})) = ${m}` };
        }
        if(t === "點斜式") {
            let x1 = M.r(-4, 4), y1 = M.r(-4, 4), m = M.r(-4, 4), c = y1 - m * x1;
            let ans = `y = ${m===1?'':m===-1?'-':m}x ${c>=0?'+':''}${c}`;
            if(m===0) ans = `y = ${c}`;
            return { question: `過點 (${x1}, ${y1}) 且斜率為 ${m} 的直線方程式？`, ...M.s(ans, `y = ${m}x ${c+1>=0?'+':''}${c+1}`, `y = ${m+1}x ${c>=0?'+':''}${c}`, `y = ${m-1}x ${c-1>=0?'+':''}${c-1}`), explanation: `y - (${y1}) = ${m}(x - (${x1})) ⮕ ${ans}` };
        }
        if(t === "平行斜率") {
            let m = M.r(-5, 5); if(m===0) m=2;
            return { question: `若 L₁ 斜率為 ${m} 且 L₁ // L₂，則 L₂ 斜率為何？`, ...M.s(m, -m, `1/${m}`, `-1/${m}`), explanation: `平行線斜率相等，故 m₂ = ${m}` };
        }
        if(t === "垂直斜率") {
            let m = M.r(2, 5) * M.p([1,-1]);
            let ans = m > 0 ? `-1/${m}` : `1/${-m}`;
            return { question: `若 L₁ 斜率為 ${m} 且 L₁ ⊥ L₂，則 L₂ 斜率為何？`, ...M.s(ans, m, -m, `1/${Math.abs(m)}`), explanation: `垂直斜率相乘為 -1，故 m₂ = ${ans}` };
        }
        if(t === "兩點距離" || t === "向量長度" || t === "空間兩點距離") {
            let is3D = t === "空間兩點距離";
            let py = M.p([[3,4,5],[5,12,13],[6,8,10],[8,15,17]]);
            let dx=py[0]*M.p([1,-1]), dy=py[1]*M.p([1,-1]), ans=py[2];
            if(M.r(0,1)) { let tmp=dx; dx=dy; dy=tmp; }
            let x1 = M.r(-3,3), y1 = M.r(-3,3);
            if(is3D) {
                let dz = M.r(1,4); ans = Math.round(Math.hypot(dx,dy,dz)*10)/10;
                return { question: `A(${x1},${y1},0), B(${x1+dx},${y1+dy},${dz}) 距離為何？`, ...M.s(ans, ans+1, ans-1, ans+2), explanation: `√(${dx}² + ${dy}² + ${dz}²) ≈ ${ans}` };
            }
            let q = t==="兩點距離" ? `A(${x1}, ${y1}), B(${x1+dx}, ${y1+dy}) 距離為何？` : `向量 (${dx}, ${dy}) 的長度？`;
            return { question: q, ...M.s(ans, ans+1, ans-1, ans+2), explanation: `√(${Math.abs(dx)}² + ${Math.abs(dy)}²) = ${ans}` };
        }
        if(t === "中點座標") {
            let x1=M.r(-5,5)*2, y1=M.r(-5,5)*2, x2=M.r(-5,5)*2, y2=M.r(-5,5)*2;
            let mx=(x1+x2)/2, my=(y1+y2)/2, ans = `(${mx}, ${my})`;
            return { question: `A(${x1}, ${y1}), B(${x2}, ${y2}) 中點？`, ...M.s(ans, `(${mx+1}, ${my})`, `(${mx}, ${my+1})`, `(${mx-1}, ${my-1})`), explanation: `((${x1}+${x2})/2, (${y1}+${y2})/2) = ${ans}` };
        }
        if(t === "重心座標") {
            let mx=M.r(-2,2), my=M.r(-2,2), x1=M.r(-3,3), y1=M.r(-3,3), x2=M.r(-3,3), y2=M.r(-3,3);
            let x3=3*mx-x1-x2, y3=3*my-y1-y2, ans = `(${mx}, ${my})`;
            return { question: `頂點 (${x1},${y1}), (${x2},${y2}), (${x3},${y3}) 重心？`, ...M.s(ans, `(${mx+1}, ${my})`, `(${mx}, ${my+1})`, `(${mx-1}, ${my-1})`), explanation: `X、Y相加除以3 = ${ans}` };
        }
        if(t === "內分點公式") {
            let a=M.r(-5,0), b=M.r(1,10), m=M.r(1,3), n=M.r(1,3);
            let ans = (n*a + m*b) / (m+n);
            return { question: `A(${a}), B(${b})，P 在 AB 上且 AP:PB=${m}:${n}，P=?`, ...M.s(ans, ans+1, ans-1, ans+2), explanation: `(${n}*(${a}) + ${m}*${b})/${m+n} = ${ans}` };
        }
        if(t === "二次函數頂點") {
            let a = M.p([1,2,-1,-2]), vx = M.r(-3,3), b = -2*a*vx, c = M.r(1,10);
            let eq = formatQuadratic(a, b, c);
            return { question: `y = ${eq} 的頂點 x 座標？`, ...M.s(vx, vx+1, vx-1, vx+2), explanation: `x = -(${b}) / (2*${a}) = ${vx}` };
        }
        if(t === "弳度轉換") {
            let deg = M.p([30,60,90,120,150,210,240,270,300,330]);
            let gcd = (a,b)=>b?gcd(b,a%b):a; let g=gcd(deg,180);
            let num=deg/g, den=180/g, ans = (num===1?"":num)+"π/"+den;
            return { question: `${deg}° 等於多少弧度？`, ...M.s(ans, `${num+1}π/${den}`, `${num}π/${den-1}`, `${num-1}π/${den}`), explanation: `${deg} * (π/180) = ${ans}` };
        }
        if(t === "特殊角" || t === "平方關係" || t === "商數關係") {
            let q = M.p(["sin 30° + cos 60° = ?", "tan 45° + sin 30° = ?", "sin 45° + cos 45° = ?"]);
            if (q.includes("30")) return { question: q, ...M.s("1", "1/2", "√3/2", "1.5"), explanation: "1/2 + 1/2 = 1" };
            if (q.includes("45")) return { question: q, ...M.s("√2", "1", "√3", "2"), explanation: "√2/2 + √2/2 = √2" };
            let val = M.p([0.6, 0.8]); let ans = val === 0.6 ? "0.64" : "0.36";
            return { question: `若 sin θ = ${val}，則 cos²θ = ?`, ...M.s(ans, "0.36", "0.64", "0.8", "0.4"), explanation: `1 - ${val}² = ${ans}` };
        }
        if(t === "扇形弧長") {
            let r=M.r(2,10), th=M.r(2,5), ans = r*th;
            return { question: `半徑 ${r}，中心角 ${th} 弧度的弧長？`, ...M.s(ans, ans+2, ans-2, ans+4), explanation: `s = ${r} * ${th} = ${ans}` };
        }
        if(t === "向量垂直" || t === "空間垂直") {
            let pairs = [{u1: 2, v1: 3, u2: -3, k: 2}, {u1: 3, v1: 4, u2: -6, k: 2}, {u1: 4, v1: 2, u2: -1, k: 8}, {u1: 5, v1: 2, u2: -2, k: 5}];
            let p = M.p(pairs);
            return { question: `u=(${p.u1}, k), v=(${p.v1}, ${p.u2}) 垂直，k=?`, ...M.s(p.k, p.k+1, p.k-1, p.k+2), explanation: `${p.u1}*${p.v1} + k*(${p.u2}) = 0 ⮕ k=${p.k}` };
        }
        if(t === "向量內積" || t === "空間內積") {
            let a=M.r(-4,4), b=M.r(-4,4), c=M.r(-4,4), d=M.r(-4,4);
            let ans = a*c + b*d;
            return { question: `u=(${a},${b}), v=(${c},${d}) 內積？`, ...M.s(ans, ans+2, ans-2, ans+4), explanation: `${a}*${c} + ${b}*${d} = ${ans}` };
        }
        if(t === "向量平行" || t === "空間平行") {
            let a=M.r(1,4), b=M.r(1,4)*M.p([1,-1]), m=M.p([2,3,-2,-3]);
            let c=a*m, d=b*m;
            return { question: `u=(${a}, ${b}), v=(${c}, k) 平行，k=?`, ...M.s(d, d+1, d-1, d+2), explanation: `${a}/${c} = ${b}/k ⮕ k=${d}` };
        }
        if(t === "二階行列式") {
            let a=M.r(2,5), b=M.r(2,5), c=M.r(2,5), d=M.r(2,5), ans = a*d - b*c;
            return { question: `第一列(${a}, ${b}), 第二列(${c}, ${d}) 的行列式？`, ...M.s(ans, ans+1, ans-1, ans+2), explanation: `${a}*${d} - ${b}*${c} = ${ans}` };
        }
        if(t === "多項式微分" || t === "微分乘法" || t === "微分加減法") {
            let a=M.r(2,5), b=M.r(2,5), ans = `${3*a}x² - ${b}`;
            return { question: `f(x) = ${a}x³ - ${b}x 的導數？`, ...M.s(ans, `${3*a}x² - ${b}x`, `${a}x² - ${b}`, `${3*a}x³ - ${b}`), explanation: `${a}(3x²) - ${b} = ${ans}` };
        }
        if(t === "多項式積分" || t === "定積分定義") {
            let a=M.r(2,4), ans = `${a*2}x³ + C`;
            return { question: `∫ ${a*6}x² dx = ?`, ...M.s(ans, `${a*6}x³ + C`, `${a*3}x³ + C`, `${a*2}x² + C`), explanation: `${a*6} * (1/3)x³ = ${ans}` };
        }
        if(t === "餘式定理") {
            let a=M.r(-3,3), b=M.r(-5,5), x=M.r(1,3);
            let ans = x*x*x + a*x + b;
            let eq = formatQuadratic(1, a, b).replace("x²", "x³"); 
            return { question: `f(x)=${eq} 除以 x-${x} 的餘式？`, ...M.s(ans, ans+1, ans-2, ans+3), explanation: `f(${x}) = ${x}³ + (${a}*${x}) + (${b}) = ${ans}` };
        }
        if(t === "等差第n項") {
            let a1=M.r(1,10), d=M.r(2,5)*M.p([1,-1]), n=M.r(5,15);
            let ans = a1 + (n-1)*d;
            return { question: `a₁=${a1}, d=${d}, a${n}=?`, ...M.s(ans, ans+d, ans-d, ans+2*d), explanation: `${a1} + ${n-1}*(${d}) = ${ans}` };
        }
        if(t === "算術平均數") {
            let base = M.r(60, 80), d1=M.r(-5,5), d2=M.r(-5,5), d3=M.r(-5,5), d4=M.r(-5,5), d5=-(d1+d2+d3+d4);
            let vals = [base+d1, base+d2, base+d3, base+d4, base+d5];
            return { question: `五個數據：${vals.join(', ')} 的平均數？`, ...M.s(base, base+1, base-1, base+2), explanation: `總和為 ${base*5}，除以 5 等於 ${base}` };
        }
        if(t === "對數定義" || t === "對數相加") {
            let b=M.r(2,5), x=M.r(2,4), ans = Math.pow(b, x);
            return { question: `log_${b} ${ans} = ?`, ...M.s(x, x+1, x-1, x*2), explanation: `${b}^${x} = ${ans}` };
        }
        if(t === "平方差公式" || t === "立方和") {
            let a = M.r(2,5), b = M.r(2,5);
            return { question: `${a*a}x² - ${b*b} 分解為？`, ...M.s(`(${a}x+${b})(${a}x-${b})`, `(${a}x-${b})²`, `(${a*a}x-${b*b})²`, `(${a}x+${b})²`), explanation: `(${a}x)² - ${b}² = (${a}x+${b})(${a}x-${b})` };
        }
        if(t === "雙重根號") {
            let a = M.r(3,6), b = M.r(1, a-1), A = a+b, B = a*b;
            return { question: `√(${A} - 2√${B}) = ?`, ...M.s(`√${a}-√${b}`, `√${a}+√${b}`, `√${A}-√${B}`, `${a}-√${b}`), explanation: `${a}+${b}=${A}, ${a}*${b}=${B} ⮕ √${a} - √${b}` };
        }
        if(t === "點到直線距離" || t === "兩平行線距離") {
            let a=3, b=4, c=M.r(5,15);
            return { question: `(0,0) 到 ${a}x+${b}y-${c}=0 距離？`, ...M.s(c/5, c/5+1, c/5-1, c/5+2), explanation: `|-${c}| / 5 = ${c/5}` };
        }
        if(t === "圓心與半徑" || t === "圓標準式" || t === "切線段長") {
            let h=M.r(-4,4), k=M.r(-4,4), r=M.r(2,5);
            let hStr = h < 0 ? `+${-h}` : `-${h}`, kStr = k < 0 ? `+${-k}` : `-${k}`;
            return { question: `圓心(${h},${k})半徑${r}的圓方程式？`, ...M.s(`(x${hStr})²+(y${kStr})²=${r*r}`, `(x${h>0?'+'+h:hStr})²+(y${kStr})²=${r*r}`, `(x${hStr})²+(y${k>0?'+'+k:kStr})²=${r*r}`, `(x${hStr})²+(y${kStr})²=${r}`), explanation: `(x-h)²+(y-k)²=r²` };
        }
        if(t === "拋物線焦點") {
            let c = M.r(1, 8) * M.p([1,-1]), isX2 = M.r(0,1);
            let q = isX2 ? `x² = ${4*c}y` : `y² = ${4*c}x`;
            let ans = isX2 ? `(0, ${c})` : `(${c}, 0)`;
            return { question: `${q} 的焦點座標為何？`, ...M.s(ans, `(0, ${-c})`, `(${-c}, 0)`, `(${4*c}, 0)`), explanation: `4c = ${4*c} ⮕ c = ${c} ⮕ 焦點 ${ans}` };
        }
        if(t === "拋物線正焦弦") {
            let c = M.r(1, 12) * M.p([1,-1]), isX2 = M.r(0,1);
            let q = isX2 ? `x² = ${4*c}y` : `y² = ${4*c}x`, ans = Math.abs(4*c);
            return { question: `${q} 的正焦弦長？`, ...M.s(ans, -ans, ans*2, Math.abs(c)), explanation: `長度必為正，|4c| = |${4*c}| = ${ans}` };
        }
        if(t === "橢圓長短軸") {
            let a = M.r(4, 10), b = M.r(2, a-1), a2 = a*a, b2 = b*b;
            let isXLong = M.r(0,1), denX = isXLong ? a2 : b2, denY = isXLong ? b2 : a2;
            let isLong = M.r(0,1), ans = isLong ? 2*a : 2*b, axisName = isLong ? "長軸" : "短軸";
            return { question: `x²/${denX} + y²/${denY} = 1，${axisName}長度為何？`, ...M.s(ans, a, b, 2*a+2*b), explanation: `${isLong?'大':'小'}的分母為 ${isLong?a2:b2} ⮕ ${isLong?'a':'b'}=${isLong?a:b} ⮕ ${axisName} 2${isLong?'a':'b'} = ${ans}` };
        }
        if(t === "橢圓焦點關係") {
            let triples = [[5,3,4], [10,6,8], [13,12,5], [17,15,8], [25,24,7]];
            let t_vals = M.p(triples), a = t_vals[0], b = t_vals[1], c = t_vals[2];
            if(M.r(0,1)) { let tmp = b; b = c; c = tmp; }
            return { question: `橢圓 a=${a}, b=${b}，焦點距離中心 c=?`, ...M.s(c, c+1, a+b, Math.abs(a-b)), explanation: `${a*a} = ${b*b} + c² ⮕ c²=${c*c} ⮕ c=${c}` };
        }
        if(t === "雙曲線漸近線") {
            let a = M.r(2, 6), b = M.r(2, 6), a2 = a*a, b2 = b*b;
            let isXPos = M.r(0,1), q = isXPos ? `x²/${a2} - y²/${b2} = 1` : `y²/${b2} - x²/${a2} = 1`;
            let ans = `${b}x±${a}y=0`;
            return { question: `${q} 的漸近線為？`, ...M.s(ans, `${a}x±${b}y=0`, `${a2}x±${b2}y=0`, `${b2}x±${a2}y=0`), explanation: `x/${a} = ±y/${b} ⮕ ${ans}` };
        }
    } catch(e) {}
    
    return M.p(topic.variants);
}

function startApp(lang) {
    curLang = lang;
    let color = '#00a8ff';
    if (lang === 'hiragana') color = '#ff4757';
    if (lang === 'katakana') color = '#2ed573';
    if (lang === 'math') color = '#e67e22';

    document.getElementById('cardArea').style.borderColor = color;
    document.getElementById('mLearn').style.backgroundColor = color;
    document.getElementById('mQuiz').style.backgroundColor = color;

    document.getElementById('homeUI').style.display = 'none';
    document.getElementById('unitSelectUI').style.display = 'flex';
    
    const sBtn = document.getElementById('soundBtn');
    if (lang === 'math') {
        sBtn.className = 'ctrl-btn btn-math-reveal';
        sBtn.innerHTML = '💡 顯示公式';
        fullData = [...mathData];
    } else {
        sBtn.className = 'ctrl-btn btn-s';
        sBtn.innerHTML = '🔊 聽發音';
        if (lang === 'zhuyin') fullData = [...zhData];
        else if (lang === 'hiragana') fullData = [...jpHiData];
        else if (lang === 'katakana') fullData = [...jpKaData];
    }
    
    renderUnitSelectUI(lang, color);
}

function renderUnitSelectUI(lang, color) {
    let ui = document.getElementById('unitSelectUI');
    let title = lang === 'math' ? '📐 選擇單元' : '📖 選擇範圍';
    
    let html = `<div style="width:90%; max-width:400px; padding-top:20px;">
        <button onclick="goHome()" style="background:transparent; border:none; font-size:16px; font-weight:bold; color:#a4b0be; margin-bottom:15px; cursor:pointer;">◀ 返回首頁</button>
        <h2 style="font-size:26px; font-weight:900; color:#4a148c; margin-bottom:20px;">${title}</h2>`;

    if (lang === 'math') {
        html += `<button onclick="startRandomQuiz(10)" style="width:100%; padding:15px; background:#f1c40f; color:white; border-radius:20px; font-weight:bold; font-size:18px; border:none; margin-bottom:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer;">🔀 隨機抽考 10 題</button>`;
        html += `<button onclick="directStartQuiz('all')" style="width:100%; padding:15px; background:#ff9f43; color:white; border-radius:20px; font-weight:bold; font-size:18px; border:none; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer;">🌟 全範圍綜合測驗</button>`;
        
        const vols = [...new Set(mathData.map(d=>d.volume))];
        vols.forEach(vol => {
            html += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #f1f2f6; margin-top:20px; margin-bottom:15px; padding-bottom:5px;">
                <h3 style="font-size:20px; font-weight:900; color:${color}; margin:0;">${vol}</h3>
                <button onclick="startVolumeQuiz('${vol}')" style="background:${color}; color:white; border:none; border-radius:10px; padding:6px 12px; font-weight:bold; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1);">🎮 測驗本冊</button>
            </div>`;
            const units = [...new Set(mathData.filter(d=>d.volume===vol).map(d=>d.unit))];
            units.forEach(unit => {
                let typeCount = mathData.filter(d=>d.volume===vol && d.unit===unit).length;
                html += `
                <div style="background:white; border-radius:20px; padding:15px; margin-bottom:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border:2px solid #f1f2f6;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div style="font-size:18px; font-weight:bold; color:#2f3542;">${unit}</div>
                        <div style="font-size:12px; font-weight:bold; color:#e67e22; background:#fff0e6; padding:4px 8px; border-radius:10px;">${typeCount} 個題型</div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="enterUnitMode('${vol}', '${unit}', 'learn')" style="flex:1; padding:12px; border-radius:12px; border:none; background:#f0f8ff; color:#00a8ff; font-weight:bold; cursor:pointer; font-size:15px;">📖 公式卡</button>
                        <button onclick="enterUnitMode('${vol}', '${unit}', 'quiz')" style="flex:1; padding:12px; border-radius:12px; border:none; background:#fff0e6; color:#e67e22; font-weight:bold; cursor:pointer; font-size:15px;">🎮 測驗</button>
                    </div>
                </div>`;
            });
        });
    } else {
        html += `<button onclick="startRandomQuiz(10)" style="width:100%; padding:15px; background:#f1c40f; color:white; border-radius:20px; font-weight:bold; font-size:18px; border:none; margin-bottom:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer;">🔀 隨機抽考 10 題</button>`;
        html += `<button onclick="directStartQuiz('all')" style="width:100%; padding:15px; background:${color}; color:white; border-radius:20px; font-weight:bold; font-size:18px; border:none; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer;">🌟 全範圍隨機測驗</button>`;
        
        let groups = [
            {n:"第一組 (1~10音)", b:[0,10]}, {n:"第二組 (11~20音)", b:[10,20]},
            {n:"第三組 (21~30音)", b:[20,30]}, {n:"第四組 (31~40音)", b:[30,40]}
        ];
        if(lang === 'zhuyin') groups[3].b = [30,37];
        else groups.push({n:"第五組 (41~46音)", b:[40,46]});

        groups.forEach((g, i) => {
            let cardCount = g.b[1] - g.b[0];
            html += `
            <div style="background:white; border-radius:20px; padding:15px; margin-bottom:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border:2px solid #f1f2f6;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-size:18px; font-weight:bold; color:#2f3542;">${g.n}</div>
                    <div style="font-size:12px; font-weight:bold; color:#00a8ff; background:#f0f8ff; padding:4px 8px; border-radius:10px;">${cardCount} 個字卡</div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="enterUnitMode('group', '${i}', 'learn')" style="flex:1; padding:12px; border-radius:12px; border:none; background:#f0f8ff; color:#00a8ff; font-weight:bold; cursor:pointer; font-size:15px;">📖 學習</button>
                    <button onclick="enterUnitMode('group', '${i}', 'quiz')" style="flex:1; padding:12px; border-radius:12px; border:none; background:#fff0e6; color:#e67e22; font-weight:bold; cursor:pointer; font-size:15px;">🎮 測驗</button>
                </div>
            </div>`;
        });
    }
    html += `</div>`;
    ui.innerHTML = html;
}

// 🔥 升級：在進入不同測驗模式時，設定獨立的單元 ID 和名稱 🔥
function startVolumeQuiz(vol) {
    curData = fullData.filter(d => d.volume === vol);
    currentBoardId = `math_vol_${vol}`;
    currentBoardName = `數學 (${vol})`;
    
    document.getElementById('unitSelectUI').style.display = 'none';
    document.getElementById('topBars').style.display = 'flex';
    document.getElementById('cardArea').style.display = 'flex';
    
    let qLen = document.getElementById('qLen');
    qLen.innerHTML = `
        <option value="5">挑戰 5 題</option>
        <option value="10">挑戰 10 題</option>
        <option value="20">挑戰 20 題</option>
        <option value="25">挑戰 25 題</option>
        <option value="0">全冊制霸</option>
    `;
    setMode('quiz');
}

function enterUnitMode(cat, val, mode) {
    if (cat === 'group') {
        let bounds = [[0,10], [10,20], [20,30], [30,40], [40,46]];
        if(curLang === 'zhuyin') bounds[3] = [30,37];
        let b = bounds[parseInt(val)];
        curData = fullData.slice(b[0], b[1]);
        
        let groupNames = ["第一組", "第二組", "第三組", "第四組", "第五組"];
        currentBoardId = `${curLang}_group_${val}`;
        currentBoardName = `${getLangName(curLang)} (${groupNames[parseInt(val)]})`;
    } else {
        curData = fullData.filter(d => d.volume === cat && d.unit === val);
        currentBoardId = `math_${cat}_${val}`;
        currentBoardName = `數學 (${cat} - ${val})`;
    }
    
    document.getElementById('unitSelectUI').style.display = 'none';
    document.getElementById('topBars').style.display = 'flex';
    document.getElementById('cardArea').style.display = 'flex';
    
    curIdx = 0;
    mathFormulaVisible = false;
    
    if (mode === 'learn') {
        setMode('learn');
    } else {
        let qLen = document.getElementById('qLen');
        qLen.innerHTML = `
            <option value="5">挑戰 5 題</option>
            <option value="10">挑戰 10 題</option>
            <option value="20">挑戰 20 題</option>
            <option value="25">挑戰 25 題</option>
            <option value="0">全單元練習</option>
        `;
        setMode('quiz');
    }
}

function directStartQuiz(val) {
    curData = [...fullData];
    currentBoardId = `${curLang}_all`;
    currentBoardName = `${getLangName(curLang)} (全範圍綜合)`;
    
    document.getElementById('unitSelectUI').style.display = 'none';
    document.getElementById('resultBoardUI').style.display = 'none';
    document.getElementById('topBars').style.display = 'flex';
    document.getElementById('cardArea').style.display = 'flex';
    
    let qLen = document.getElementById('qLen');
    qLen.innerHTML = `
        <option value="10">挑戰 10 題</option>
        <option value="20">挑戰 20 題</option>
        <option value="25">挑戰 25 題</option>
        <option value="0">全範圍總複習</option>
    `;
    setMode('quiz');
}

function startRandomQuiz(num) {
    curData = [...fullData];
    currentBoardId = `${curLang}_random_${num}`;
    currentBoardName = `${getLangName(curLang)} (隨機抽考 ${num} 題)`;
    
    document.getElementById('qLen').innerHTML = `<option value="${num}" selected>隨機抽考 ${num} 題</option>`;
    
    document.getElementById('unitSelectUI').style.display = 'none';
    document.getElementById('topBars').style.display = 'flex'; 
    document.getElementById('cardArea').style.display = 'flex';
    
    setMode('quiz');
    runQuiz(); 
}

function goBackToUnits() {
    document.getElementById('topBars').style.display = 'none';
    document.getElementById('cardArea').style.display = 'none';
    document.getElementById('resultBoardUI').style.display = 'none';
    document.getElementById('unitSelectUI').style.display = 'flex';
}

function triggerTopShuffle() {
    if (curMode === 'learn') {
        shuffleData();
    } else {
        runQuiz();
    }
}

// 點擊整張字卡的通用處理函數 (支援發音與數學公式切換)
function handleCardClick() {
    if (curLang === 'math') {
        if (curMode === 'quiz') return; 
        toggleMathFormula();
    } else {
        speakCurrent(); 
        if (curLang === 'hiragana' || curLang === 'katakana') {
            const romajiDiv = document.getElementById('romajiDisp');
            if (romajiDiv) romajiDiv.style.display = 'block';
        }
    }
}

// 底部按鈕同樣綁定此功能
function handlePrimaryAction() {
    handleCardClick();
}

function toggleMathFormula() {
    if (curLang === 'math') {
        mathFormulaVisible = !mathFormulaVisible;
        const sBtn = document.getElementById('soundBtn');
        if (mathFormulaVisible) {
            sBtn.innerHTML = '👀 隱藏公式';
            sBtn.style.backgroundColor = '#d35400';
        } else {
            sBtn.innerHTML = '💡 顯示公式';
            sBtn.style.backgroundColor = '#e67e22';
        }
        renderDataToCard(curData[curIdx]);
    }
}

function setMode(mode) {
    curMode = mode;
    let color = '#00a8ff';
    if (curLang === 'hiragana') color = '#ff4757';
    if (curLang === 'katakana') color = '#2ed573';
    if (curLang === 'math') color = '#e67e22';

    document.getElementById('mLearn').classList.toggle('active', mode === 'learn');
    document.getElementById('mLearn').style.backgroundColor = mode === 'learn' ? color : 'transparent';
    document.getElementById('mLearn').style.color = mode === 'learn' ? 'white' : '#a4b0be';
    
    document.getElementById('mQuiz').classList.toggle('active', mode === 'quiz');
    document.getElementById('mQuiz').style.backgroundColor = mode === 'quiz' ? color : 'transparent';
    document.getElementById('mQuiz').style.color = mode === 'quiz' ? 'white' : '#a4b0be';
    
    document.getElementById('learnView').style.display = 'none';
    document.getElementById('quizStartView').style.display = 'none';
    document.getElementById('quizPlayView').style.display = 'none';
    document.getElementById('resultBoardUI').style.display = 'none';
    document.getElementById('learnCtrls').style.display = 'none';
    document.getElementById('quizCtrls').style.display = 'none';
    
    if (mode === 'learn') {
        document.getElementById('learnView').style.display = 'flex';
        document.getElementById('learnCtrls').style.display = 'flex';
        document.getElementById('progText').style.display = 'block';
        updateCard();
    } else {
        document.getElementById('quizStartView').style.display = 'flex';
        document.getElementById('progText').style.display = 'none';
    }
}

function updateCard() {
    let d = curData[curIdx];
    renderDataToCard(d);
    document.getElementById('progText').innerText = `${curIdx + 1} / ${curData.length}`;
}

function renderDataToCard(d, quizExp = null) {
    let html = '';
    
    if (curLang === 'math') {
        document.getElementById('symDisp').innerText = d.title;
        document.getElementById('symDisp').style.fontSize = 'clamp(35px, 8vh, 48px)';
        document.getElementById('emoDisp').style.display = 'none'; 
        document.getElementById('romajiDisp').style.display = 'none'; 
        
        let blurClass = (!mathFormulaVisible && !quizExp) ? 'blur-content' : '';
        let formulaText = d.front.formula;
        let hintText = `💡 ${d.front.hint}`;
        
        html = `<div style="display:flex; flex-direction:column; align-items:center; width:100%;">
                    <div class="math-formula ${blurClass}">${formulaText}</div>
                    <div class="math-hint ${blurClass}">${hintText}</div>`;
        if (quizExp) {
            html += `<div class="math-exp">【解析】 ${quizExp}</div>`;
        }
        html += `</div>`;
    } else {
        document.getElementById('symDisp').innerText = d.s;
        document.getElementById('symDisp').style.fontSize = 'clamp(65px, 14vh, 90px)';
        document.getElementById('emoDisp').innerText = d.e;
        document.getElementById('emoDisp').style.display = 'block';

        // 處理日文的羅馬拼音邏輯
        if (curLang === 'hiragana' || curLang === 'katakana') {
            document.getElementById('romajiDisp').innerText = romajiMap[d.s] || '';
            document.getElementById('romajiDisp').style.display = quizExp ? 'block' : 'none';
        } else {
            document.getElementById('romajiDisp').style.display = 'none'; 
        }

        if (curLang === 'zhuyin') {
            let chars = d.w.split(''), zys = d.z.split(' ');
            chars.forEach((c, i) => {
                let z = zys[i] || '', t = '', b = z;
                if (z.includes('˙')) { b = z.replace('˙',''); html += `<div class="zh-char-row"><div class="zh-text">${c}</div><div class="zy-stack"><span>˙</span>${b.split('').map(s=>`<span>${s}</span>`).join('')}</div></div>`; }
                else {
                    if (z.includes('ˊ')) { t = 'ˊ'; b = z.replace('ˊ',''); }
                    else if (z.includes('ˇ')) { t = 'ˇ'; b = z.replace('ˇ',''); }
                    else if (z.includes('ˋ')) { t = 'ˋ'; b = z.replace('ˋ',''); }
                    html += `<div class="zh-char-row"><div class="zh-text">${c}</div><div class="zy-stack">${b.split('').map(s=>`<span>${s}</span>`).join('')}</div><div style="font-size:16px; color:#ff4757; margin-left:1px; font-weight:900;">${t}</div></div>`;
                }
            });
        } else {
            html = `<div><div class="jp-text">${d.w}</div><div class="jp-mean">${d.m}</div></div>`;
        }
    }
    document.getElementById('wordDisp').innerHTML = html;
}

function nav(dir) { 
    curIdx = (curIdx + dir + curData.length) % curData.length; 
    mathFormulaVisible = false;
    if(curLang === 'math') {
        document.getElementById('soundBtn').innerHTML = '💡 顯示公式';
        document.getElementById('soundBtn').style.backgroundColor = '#e67e22';
    }
    updateCard(); 
}

function shuffleData() { 
    curData = shuffleArray(curData); 
    curIdx = 0; 
    mathFormulaVisible = false;
    if(curLang === 'math') {
        document.getElementById('soundBtn').innerHTML = '💡 顯示公式';
        document.getElementById('soundBtn').style.backgroundColor = '#e67e22';
    }
    updateCard(); 
}

function speakSequence(items) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    items.forEach(it => {
        let u = new SpeechSynthesisUtterance(it.t);
        u.lang = it.l || (curLang === 'zhuyin' ? 'zh-TW' : 'ja-JP');
        u.rate = it.r || (u.lang === 'ja-JP' ? 0.45 : 0.8);
        window.speechSynthesis.speak(u);
    });
}

function speakCurrent() { 
    if (curLang !== 'math') {
        let d = (curMode === 'quiz' && curQ) ? curQ : curData[curIdx]; 
        speakSequence([{t: d.s}, {t: d.w}]); 
    }
}

function startQuizWithName() {
    let name = document.getElementById('playerNameInputStart').value.trim();
    currentPlayerName = name ? name : '無名英雄';
    runQuiz();
}

function startQuizSkipName() {
    document.getElementById('playerNameInputStart').value = '';
    currentPlayerName = '無名英雄';
    runQuiz();
}

function retryQuiz() {
    document.getElementById('resultBoardUI').style.display = 'none';
    document.getElementById('topBars').style.display = 'flex';
    document.getElementById('cardArea').style.display = 'flex';
    runQuiz();
}

function runQuiz() {
    let len = parseInt(document.getElementById('qLen').value);
    if (len === 0 || len > curData.length) len = curData.length;
    
    quizPool = [];
    if (curLang === 'math') {
        len = parseInt(document.getElementById('qLen').value);
        if (len === 0) len = curData.length;
        let shuffledData = shuffleArray([...curData]);
        for (let i = 0; i < len; i++) {
            quizPool.push(shuffledData[i % shuffledData.length]);
        }
    } else {
        quizPool = shuffleArray([...curData]).slice(0, len);
    }
    quizMax = quizPool.length;
    quizPool = shuffleArray(quizPool); 
    
    quizIdx = 0; totalScore = 0; currentQuestionAttempts = 0; currentStreak = 0;
    
    document.getElementById('quizStartView').style.display = 'none';
    document.getElementById('resultBoardUI').style.display = 'none';
    nextQuestion();
}

function nextQuestion() {
    if (quizIdx >= quizMax) {
        document.getElementById('quizPlayView').style.display = 'none';
        document.getElementById('quizCtrls').style.display = 'none';
        document.getElementById('cardArea').style.display = 'none'; 
        document.getElementById('topBars').style.display = 'none'; 
        document.getElementById('resultBoardUI').style.display = 'flex'; 
        
        let finalScore = Math.round(totalScore);
        document.getElementById('finalScoreText').innerText = finalScore;
        document.getElementById('resultNameDisp').innerText = currentPlayerName;
        
        if (window.autoSubmitScore) {
            window.autoSubmitScore(currentPlayerName, finalScore, curLang);
        }
        return;
    }
    
    curQ = quizPool[quizIdx++];
    currentQuestionAttempts = 0; 
    
    let currentScoreDisp = Math.round(totalScore);
    document.getElementById('qStat').innerText = `第 ${quizIdx} / ${quizMax} 題 | 目前得分: ${currentScoreDisp} 分`;
    document.getElementById('learnView').style.display = 'none';
    document.getElementById('quizPlayView').style.display = 'flex';
    document.getElementById('quizCtrls').style.display = 'flex';
    document.getElementById('nextQBtn').style.display = 'none';
    
    let grid = document.getElementById('optGrid');
    grid.innerHTML = '';

    if (curLang === 'math') {
        document.getElementById('quizSoundBtn').style.display = 'none'; 
        
        let variant = generateDynamicMathVariant(curQ);
        
        grid.innerHTML = `<div style="grid-column: 1 / -1; font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; text-align: left; padding: 0 5px;">${variant.question}</div>`;
        
        variant.options.forEach((optText, idx) => {
            let b = document.createElement('button');
            b.className = 'opt-btn'; 
            b.style.fontSize = 'clamp(14px, 4vw, 18px)'; 
            b.innerText = `(${String.fromCharCode(65+idx)}) ${optText}`;
            b.onclick = () => {
                if(idx === variant.correctAnswer) {
                    b.classList.add('correct');
                    
                    let earned = 0;
                    if (currentQuestionAttempts === 0) {
                        earned = 100 / quizMax;
                        currentStreak++;
                    } else if (currentQuestionAttempts === 1) {
                        earned = 1;
                        currentStreak = 0;
                    } else {
                        earned = 0;
                        currentStreak = 0;
                    }
                    
                    totalScore += earned;
                    
                    let newScoreDisp = Math.round(totalScore);
                    document.getElementById('qStat').innerText = `第 ${quizIdx} / ${quizMax} 題 | 目前得分: ${newScoreDisp} 分`;

                    if (currentQuestionAttempts === 0 && currentStreak % 5 === 0 && currentStreak > 0) {
                        const randomPraise = praises[Math.floor(Math.random() * praises.length)];
                        speakSequence([{t: randomPraise, l: "zh-TW"}]);
                    }

                    setTimeout(() => {
                        document.getElementById('quizPlayView').style.display = 'none';
                        document.getElementById('learnView').style.display = 'flex';
                        renderDataToCard(curQ, variant.explanation); 
                        document.getElementById('nextQBtn').style.display = 'block';
                    }, 800);
                } else { 
                    b.classList.add('wrong'); 
                    currentQuestionAttempts++; 
                    let u = new SpeechSynthesisUtterance("再試一次喔"); u.lang="zh-TW"; window.speechSynthesis.speak(u); 
                }
            };
            grid.appendChild(b);
        });

    } else {
        document.getElementById('quizSoundBtn').style.display = 'block';
        let opts = [curQ];
        
        let sourceData = [];
        if (curLang === 'zhuyin') sourceData = zhData;
        else if (curLang === 'hiragana') sourceData = jpHiData;
        else if (curLang === 'katakana') sourceData = jpKaData;

        while(opts.length < 4) {
            let r = sourceData[Math.floor(Math.random() * sourceData.length)];
            if(!opts.find(o => o.s === r.s)) opts.push(r);
        }
        opts.sort(() => Math.random() - 0.5);
        
        opts.forEach(o => {
            let b = document.createElement('button');
            b.className = 'opt-btn'; 
            b.style.fontSize = 'clamp(32px, 12vw, 55px)';
            b.style.padding = '25px 15px';
            b.innerText = o.s;
            b.onclick = () => {
                if(o.s === curQ.s) {
                    b.classList.add('correct');
                    
                    let earned = 0;
                    if (currentQuestionAttempts === 0) {
                        earned = 100 / quizMax;
                        currentStreak++;
                    } else if (currentQuestionAttempts === 1) {
                        earned = 1;
                        currentStreak = 0;
                    } else {
                        earned = 0;
                        currentStreak = 0;
                    }
                    
                    totalScore += earned;
                    let newScoreDisp = Math.round(totalScore);
                    document.getElementById('qStat').innerText = `第 ${quizIdx} / ${quizMax} 題 | 目前得分: ${newScoreDisp} 分`;

                    let speechItems = [];
                    if (currentQuestionAttempts === 0 && currentStreak % 5 === 0 && currentStreak > 0) {
                        const randomPraise = praises[Math.floor(Math.random() * praises.length)];
                        speechItems.push({t: randomPraise, l: "zh-TW"});
                    }
                    speechItems.push({t: curQ.s});
                    speechItems.push({t: curQ.w});
                    speakSequence(speechItems);

                    setTimeout(() => {
                        document.getElementById('quizPlayView').style.display = 'none';
                        document.getElementById('learnView').style.display = 'flex';
                        renderDataToCard(curQ, true); 
                        document.getElementById('nextQBtn').style.display = 'block';
                    }, 800);
                } else { 
                    b.classList.add('wrong'); 
                    currentQuestionAttempts++;
                    let u = new SpeechSynthesisUtterance("再試一次喔"); u.lang="zh-TW"; window.speechSynthesis.speak(u); 
                }
            };
            grid.appendChild(b);
        });
        playQuizVoice();
    }
}

function playQuizVoice() { 
    if (curLang !== 'math') {
        speakSequence([{t: curQ.s}, {t: curQ.w}]); 
    }
}
</script>

<!-- 🔥 Firebase 模組：極簡純資料庫連線 (完全移除 Auth，解決報錯) 🔥 -->
<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

    // 🚨🚨 已經幫你把真實的 Firebase Config 填入囉！直接覆蓋上傳即可 🚨🚨
    const myFirebaseConfig = {
        apiKey: "AIzaSyC6uY2nVft8fSiAeF2Kl-0QEGa_H-sb94E",
        authDomain: "card-card-love.firebaseapp.com",
        projectId: "card-card-love",
        storageBucket: "card-card-love.firebasestorage.app",
        messagingSenderId: "678670908571",
        appId: "1:678670908571:web:9ce1c4bdba676b70b6da3e",
        measurementId: "G-KJ0GWKVMKV"
    };

    const isOfflineMode = myFirebaseConfig.apiKey === "請填入你的_API_KEY" || !myFirebaseConfig.apiKey;
    
    let leaderboardData = [];
    
    // 🔥 升級：動態渲染過濾後的獨立排行榜 🔥
    function renderLeaderboardList() {
        const listDiv = document.getElementById('leaderboardList');
        if (!listDiv) return;
        
        // 1. 動態更新榜單的標題
        const titleText = document.getElementById('leaderboardTitleText');
        if (titleText) {
            titleText.innerText = currentBoardName + ' 英雄榜';
        }

        // 2. 只過濾出屬於「目前單元」的成績資料
        const filteredData = leaderboardData.filter(entry => entry.boardId === currentBoardId);

        if (filteredData.length === 0) {
            listDiv.innerHTML = `<div style="text-align:center; color:#999; margin-top:20px; line-height: 1.5;">這個單元目前還沒有人留下紀錄喔！<br>趕快搶下第一名吧！</div>`;
            return;
        }

        let html = '';
        filteredData.slice(0, 50).forEach((entry, idx) => {
            let rankClass = '';
            let medal = `#${idx + 1}`;
            if (idx === 0) { rankClass = 'lb-rank-1'; medal = '🥇 1'; }
            if (idx === 1) { rankClass = 'lb-rank-2'; medal = '🥈 2'; }
            if (idx === 2) { rankClass = 'lb-rank-3'; medal = '🥉 3'; }
            
            let badgeColor = entry.lang === 'math' ? '#e67e22' : '#00a8ff';
            let badgeText = entry.lang === 'math' ? '數' : '語';

            html += `
                <div class="lb-row ${rankClass}">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span style="font-size:18px; width:45px;">${medal}</span>
                        <span style="background:${badgeColor}; color:white; font-size:10px; padding:2px 5px; border-radius:5px;">${badgeText}</span>
                        <span>${entry.name}</span>
                    </div>
                    <div style="font-size:20px; color:#2f3542;">${entry.score} <span style="font-size:12px; color:#a4b0be;">分</span></div>
                </div>
            `;
        });
        listDiv.innerHTML = html;
    }

    if (isOfflineMode) {
        setTimeout(() => {
            const listDiv = document.getElementById('leaderboardList');
            const titleDiv = document.getElementById('leaderboardTitle');
            if (listDiv) {
                listDiv.innerHTML = `
                    <div style="text-align:center; color:#ff4757; margin-top:20px; font-weight:bold; line-height: 1.5;">
                        📍 目前為單機模式<br>
                        <span style="font-size:12px;color:#a4b0be;">
                        （因為您沒有設定真實的 Firebase 金鑰，<br>目前分數只會保存在您的手機畫面上喔！）
                        </span>
                    </div>`;
            }
            if (titleDiv) titleDiv.innerHTML = '<span>📍</span> 本機英雄榜';
        }, 500);

        window.autoSubmitScore = (name, score, lang) => {
            leaderboardData.push({ name, score, lang, boardId: currentBoardId, boardName: currentBoardName, timestamp: Date.now() });
            leaderboardData.sort((a, b) => b.score - a.score);
            renderLeaderboardList();
        };

    } else {
        try {
            const app = initializeApp(myFirebaseConfig);
            const db = getFirestore(app);
            const lbRef = collection(db, 'cardcardlove_leaderboard'); 

            let isDataLoaded = false; 

            onSnapshot(lbRef, (snapshot) => {
                isDataLoaded = true; 
                leaderboardData = snapshot.docs.map(doc => doc.data());
                leaderboardData.sort((a, b) => b.score - a.score); 
                renderLeaderboardList();
                
                document.getElementById('firebaseSetupWizard').style.display = 'none';
            }, (error) => {
                isDataLoaded = true; 
                console.error("讀取榜單失敗", error);
                
                const listDiv = document.getElementById('leaderboardList');
                if (listDiv) {
                    if (error.message.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
                        document.getElementById('firebaseSetupWizard').style.display = 'flex';
                        listDiv.innerHTML = '<div style="text-align:center; color:#ff4757; font-weight:bold; margin-top:15px;">🛑 權限被阻擋，請按照彈出視窗的指示修改 Firebase 規則。</div>';
                    } else {
                        listDiv.innerHTML = `
                            <div style="text-align:center; color:#ff4757; font-weight:bold; margin-top:15px; line-height:1.4;">
                                無法讀取全球榜單 😢<br>
                                <span style="font-size:12px;">資料庫讀取失敗。<br>請確認 Firestore 已成功建立並開啟「測試模式」。</span>
                            </div>`;
                    }
                }
            });

            setTimeout(() => {
                if (!isDataLoaded) {
                    const listDiv = document.getElementById('leaderboardList');
                    if (listDiv && listDiv.innerHTML.includes('載入榜單中')) {
                        listDiv.innerHTML = `
                            <div style="text-align:center; color:#ff4757; font-weight:bold; margin-top:15px; line-height:1.4;">
                                ⚠️ 連線逾時或失敗！<br>
                                <span style="font-size:12px; color:#a4b0be;">
                                請確認 Firebase 金鑰填寫無誤，<br>
                                並且有在控制台按下「建立資料庫」。
                                </span>
                            </div>`;
                    }
                }
            }, 5000);

            window.autoSubmitScore = async (name, score, lang) => {
                try {
                    await addDoc(lbRef, {
                        name: name,
                        score: score,
                        lang: lang,
                        // 🔥 寫入資料庫時加上單元 ID 和名稱的標籤
                        boardId: currentBoardId,
                        boardName: currentBoardName,
                        timestamp: Date.now() 
                    });
                } catch (error) {
                    console.error("寫入錯誤", error);
                    const listDiv = document.getElementById('leaderboardList');
                    if (listDiv) {
                        if (error.message.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
                            document.getElementById('firebaseSetupWizard').style.display = 'flex';
                            listDiv.innerHTML = '<div style="text-align:center; color:#ff4757; font-weight:bold; margin-top:15px;">🛑 成績上傳被阻擋，請按照彈出視窗指示修改 Firebase 規則。</div>';
                        } else {
                            listDiv.innerHTML = `
                                <div style="text-align:center; color:#ff4757; font-weight:bold; margin-top:15px; line-height:1.4;">
                                    成績上傳失敗 😢<br>
                                    <span style="font-size:12px;">寫入發生錯誤。<br>請前往 Firebase 規則確認是否已改為 Test Mode。</span>
                                </div>`;
                        }
                    }
                }
            };
        } catch (error) {
            console.error("Firebase 初始化失敗", error);
        }
    }
</script>
</body>
</html>