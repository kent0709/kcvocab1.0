// ===== FRONTEND (React) =====
// 重點：改成呼叫自己的 API，不直接打 Gemini

import React, { useState } from 'react';

export default function App() {
  const [input, setInput] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '生成失敗');

      setCards(data.cards);
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>AI 單字卡</h1>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="輸入內容"
        style={{ width: '100%', height: 120 }}
      />

      <button onClick={generate} disabled={loading}>
        {loading ? '生成中...' : '生成'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {cards.map((c, i) => (
          <li key={i}>
            <b>{c.word}</b> - {c.meaning}
          </li>
        ))}
      </ul>
    </div>
  );
}


// ===== BACKEND (Vercel API) =====
// 路徑：/pages/api/generate.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    const prompt = `分析文字 """${text}""" 萃取英文單字，回傳 JSON 陣列：[{"word":"","meaning":""}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message });
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      return res.status(500).json({ error: 'AI 回傳格式錯誤' });
    }

    return res.status(200).json({ cards: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


// ===== VERCEL 設定 =====
// 在 Vercel dashboard 設定環境變數
// GEMINI_API_KEY=你的金鑰


// ===== Firebase Rules（如果要用） =====
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
*/


// ===== 重點修正 =====
// 1. 不再在前端暴露 API KEY
// 2. 加入後端 proxy
// 3. JSON parsing 防呆
// 4. 可直接部署 Vercel
