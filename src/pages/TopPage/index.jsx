import React, { useState } from 'react';

export const TopPage = () => {
  const [url, setUrl] = useState('');
  const [history, setHistory] = useState([]); // 1. 履歴を保存する配列
  const [loading, setLoading] = useState(false);

  // 一括解析データ用
  const [replies, setReplies] = useState([]); // 300件の全データ
  const [displayCount, setDisplayCount] = useState(25); // 25, 50, 100

  // 1. 【一括判定ボタン】の実装
  const fetchBulkAnalysis = async () => {
   // 🌟 ガード節：URLがないと本番APIは叩けないワン！
    if (!url) return alert("解析したいポストのURLを入力してほしいワン！🐶");
    
    setLoading(true);
    try {
      // 🌟 Railsの index アクションに URL を渡す
      // encodeURIComponent を使うことで、URLの中の「/」や「?」が壊れないようにします
      const response = await fetch(`http://localhost:3000/api/v1/analyses?url=${encodeURIComponent(url)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setReplies(result.data); // 取得した最大100件を保存
        // 2. 🌟 履歴（History）にも保存！
        // 一括解析の結果（配列）を既存の履歴の先頭に合体させます
        // slice(0, 20) などで履歴が長くなりすぎないようダイエットします
        const newItems = result.data.map(item => ({
          ...item,
          is_zombie: item.is_zombie_copy, // キー名を履歴用と合わせる
          score: Math.round(item.similarity_rate * 100) // 0-100の整数に変換
        }));

        setHistory(prevHistory => [...newItems, ...prevHistory].slice(0, 50));
        
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('本番スキャンに失敗したワン... 😢');
    } finally {
      setLoading(false);
    }
  };

  // 2. 表示用に切り出し
  const visibleReplies = replies.slice(0, displayCount);

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

        {/* 🌟 一括解析ボタン（モックデータ用） */}
        <button 
          onClick={fetchBulkAnalysis}
          style={{ marginTop: '10px', padding: '8px 16px', background: 'transparent', color: '#00ff00', border: '1px solid #00ff00', cursor: 'pointer', borderRadius: '4px' }}
        >
          RUN BULK ANALYSIS (MAX 100 REPLIES)
        </button>
      </div>

      {/* 🌟 4.5-D-2: 一括解析結果表示エリア */}
      {replies.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '40px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>
            <h2 style={{ margin: 0 }}>🛡️ DEFENSE LINE (REPLIES)</h2>
            
            {/* 件数切り替えセレクトボックス */}
            <div style={{ color: '#00ff00' }}>
              SHOW: 
              <select 
                value={displayCount} 
                onChange={(e) => setDisplayCount(Number(e.target.value))}
                style={{ background: '#000', color: '#00ff00', border: '1px solid #00ff00', marginLeft: '10px' }}
              >
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '20px' }}>
            {visibleReplies.map((reply, index) => {
              const isZombie = reply.is_zombie_copy;
              const cardStyle = {
                padding: '12px',
                background: isZombie ? 'rgba(255, 0, 0, 0.15)' : '#222', // ゾンビは少し赤を強めに
                border: isZombie ? '1px solid #ff0000' : '1px solid #444',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
                animation: isZombie ? 'pulse 2s infinite' : 'none'
              };

              return (
                <div key={index} style={cardStyle}>
                  {/* 🌟 投稿者情報エリアを追加 */}
                  <div style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {reply.name || "Unknown"}
                      </span>
                      {reply.verified && <span style={{ color: '#1DA1F2', fontSize: '0.8em' }}>☑️</span>}
                    </div>
                    <div style={{ fontSize: '0.75em', color: '#888' }}>
                      @{reply.screen_name || "id_unknown"}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '8px' }}>
                    <span style={{ color: reply.verified ? '#1DA1F2' : '#666' }}>
                      STATUS: {reply.verified ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                    <span style={{ color: isZombie ? '#ff0000' : '#00ff00', fontWeight: 'bold' }}>
                      SIM: {(reply.similarity_rate * 100).toFixed(1)}%
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85em', margin: '10px 0', color: isZombie ? '#ffcccc' : '#eee', lineHeight: '1.4' }}>
                    {reply.text}
                  </p>

                  {isZombie && (
                    <div style={{ 
                      fontSize: '0.7em', 
                      color: '#ff0000', 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      textShadow: '0 0 5px #ff0000' 
                    }}>
                      ⚠️ COPY-PASTE DETECTED
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes pulse {
    0% { box-shadow: 0 0 5px rgba(255,0,0,0.2); }
    50% { box-shadow: 0 0 15px rgba(255,0,0,0.4); }
    100% { box-shadow: 0 0 5px rgba(255,0,0,0.2); }
  }
`;
document.head.appendChild(styleTag);