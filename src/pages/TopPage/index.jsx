import React, { useState } from 'react';

export const TopPage = () => {
  const [url, setUrl] = useState('');
  const [history, setHistory] = useState([]); // 1. 履歴を保存する配列
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return alert("URLを入力してほしいワン！🐶");
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url }),
      });
      const data = await response.json();
      
      // 2. 新しい結果を履歴の先頭に追加
      const newHistory = [data.data, ...history].slice(0, 10);
      setHistory(newHistory);
      setUrl(''); // 入力欄を空にする
    } catch (error) {
      alert('通信失敗だワン... 😢');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh', padding: '40px', fontFamily: 'monospace' }}>
      <h1 style={{ textAlign: 'center', color: '#00ff00', textShadow: '0 0 10px #00ff00' }}>🧟‍♂️ ZOMBIE CLEANER</h1>
      
      {/* 入力エリア */}
      <div style={{ maxWidth: '600px', margin: '0 auto 40px', textAlign: 'center' }}>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="解析するURLを入力..."
          style={{ width: '70%', padding: '12px', background: '#333', color: '#fff', border: '1px solid #00ff00', borderRadius: '4px' }}
        />
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          style={{ padding: '12px 24px', marginLeft: '10px', background: '#00ff00', color: '#000', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'SCANNING...' : 'SCAN URL'}
        </button>
      </div>

      {/* 3. 履歴表示エリア */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>📊 SCAN HISTORY</h2>
        {history.length === 0 && <p style={{ color: '#666' }}>まだスキャン履歴はありません。</p>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {history.map((item, index) => {
            // 🌟 スコアに応じて色やメッセージを決める
            const isDanger = item.score >= 80;
            const isWarning = item.score >= 50 && item.score < 80;
            const themeColor = isDanger ? '#ff0000' : (isWarning ? '#ffaa00' : '#00ff00');

            return (
              <div key={index} style={{ 
                padding: '15px', 
                background: '#2a2a2a', 
                borderRadius: '8px', 
                borderLeft: `5px solid ${themeColor}`,
                boxShadow: isDanger ? '0 0 15px rgba(255,0,0,0.4)' : '0 4px 6px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* 危険な時の「警告」バッジ */}
                {isDanger && <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.7em', color: '#ff0000', fontWeight: 'bold' }}>⚠️ DANGER</div>}

                <div style={{ fontWeight: 'bold', color: themeColor }}>
                  {item.is_zombie ? '🧟‍♂️ ZOMBIE DETECTED' : '👤 HUMAN VERIFIED'}
                </div>
                
                <div style={{ fontSize: '0.9em', margin: '5px 0' }}>@{item.screen_name}</div>
                
                {/* 🌟 ゲージ（プログレスバー）を追加 */}
                <div style={{ width: '100%', height: '8px', background: '#444', borderRadius: '4px', margin: '10px 0' }}>
                  <div style={{ 
                    width: `${item.score}%`, 
                    height: '100%', 
                    background: themeColor, 
                    borderRadius: '4px',
                    transition: 'width 1s ease-in-out'
                  }} />
                </div>

                <div style={{ fontSize: '0.8em', color: '#aaa', height: '40px', overflow: 'hidden' }}>{item.description}</div>
                
                <div style={{ marginTop: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2em', color: themeColor }}>
                  {item.score}<span style={{ fontSize: '0.6em', color: '#666' }}>/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};