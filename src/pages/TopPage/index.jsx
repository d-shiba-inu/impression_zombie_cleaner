import React, { useState, useEffect } from 'react'; // 🌟 useEffect を追加

// 🌟 バッジの種類に応じて色とラベルを返す関数
const getBadgeStyle = (badgeType, verified) => {
  if (!verified) return { color: '#666', label: 'UNVERIFIED', icon: null };
  
  switch (badgeType) {
    case 'gold':
      return { color: '#FFD700', label: 'CORPORATE', icon: '☑️' }; // 金バッジ
    case 'government':
      return { color: '#808080', label: 'GOVERNMENT', icon: '☑️' }; // グレーバッジ
    case 'blue':
      return { color: '#1DA1F2', label: 'VERIFIED', icon: '☑️' }; // 青バッジ
    default:
      return { color: '#1DA1F2', label: 'VERIFIED', icon: '☑️' }; // 予備（青）
  }
};

export const TopPage = () => {
  const [url, setUrl] = useState('');
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(false);

  // 一括解析データ用
  const [replies, setReplies] = useState([]); 
  const [displayCount, setDisplayCount] = useState(25); 

  // 🌟 【追加】ページ読み込み時に実行される魔法
  useEffect(() => {
    fetchHistory();
  }, []);

  // 🌟 【追加】RailsのDBから履歴を取得する関数
  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/analyses/history');
      const result = await response.json();
      if (result.status === 'success') {
        setHistory(result.data); // DBのデータをセット
      }
    } catch (error) {
      console.error("履歴のロードに失敗だワン... 😢", error);
    }
  };

  // 1. 【一括判定ボタン】の実装
  const fetchBulkAnalysis = async () => {
    if (!url) return alert("解析したいポストのURLを入力してほしいワン！🐶");
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/analyses?url=${encodeURIComponent(url)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        // ① メインの結果エリアを更新
        setReplies(result.data); 
        
        // ② 🌟 履歴の更新
        // Rails側で一括保存が終わっているので、fetchHistoryを呼ぶだけで
        // 最新の100件が履歴に反映されます！
        fetchHistory();

      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('本番スキャンに失敗したワン... 😢');
    } finally {
      setLoading(false);
    }
  };

  // 2. 単体スキャン
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
      
      if (data.status === 'success') {
        // 🌟 DB保存済みの新しい結果を履歴の先頭に追加
        setHistory(prev => [data.data, ...prev].slice(0, 50));
        setUrl(''); 
      }
    } catch (error) {
      alert('通信失敗だワン... 😢');
    } finally {
      setLoading(false);
    }
  };

  const visibleReplies = replies.slice(0, displayCount);

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

      {/* 🌟 D-2: 一括解析結果表示エリア */}
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
              
              // 🌟 バッジ判定ロジックを適用
              const badge = getBadgeStyle(reply.badge_type, reply.verified);

              const cardStyle = {
                padding: '12px',
                background: isZombie ? 'rgba(255, 0, 0, 0.15)' : '#222',
                border: isZombie ? '1px solid #ff0000' : '1px solid #444',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
                animation: isZombie ? 'pulse 2s infinite' : 'none'
              };

              return (
                <div key={index} style={cardStyle}>
                  {/* 投稿者情報エリア */}
                  <div style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {reply.name || "Unknown"}
                      </span>
                      {/* 🌟 バッジの色とアイコンを動的に表示 */}
                      {reply.verified && <span style={{ color: badge.color, fontSize: '0.9em' }}>{badge.icon}</span>}
                    </div>
                    <div style={{ fontSize: '0.75em', color: '#888' }}>
                      @{reply.screen_name || "id_unknown"}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '8px' }}>
                    {/* 🌟 ステータスラベルの色と文字も連動 */}
                    <span style={{ color: badge.color }}>
                      STATUS: {badge.label}
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
      {/* 3. 履歴表示エリア */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>📊 SCAN HISTORY</h2>
        {history.length === 0 && <p style={{ color: '#666' }}>まだスキャン履歴はありません。</p>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {history.map((item, index) => {
            const isDanger = item.score >= 80;
            const isWarning = item.score >= 50 && item.score < 80;
            const themeColor = isDanger ? '#ff0000' : (isWarning ? '#ffaa00' : '#00ff00');
            
            // 🌟 履歴側でもバッジ判定ロジックを適用
            const badge = getBadgeStyle(item.badge_type, item.verified);

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
                {isDanger && <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.7em', color: '#ff0000', fontWeight: 'bold' }}>⚠️ DANGER</div>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.name || "Unknown"}
                    {/* 🌟 履歴の名前の横にも動的な色のバッジを表示 */}
                    {item.verified && <span style={{ color: badge.color, fontSize: '0.9em' }}>{badge.icon}</span>}
                  </div>
                  <div style={{ fontSize: '0.7em', color: themeColor, fontWeight: 'bold', border: `1px solid ${themeColor}`, padding: '2px 6px', borderRadius: '4px' }}>
                    {item.is_zombie ? 'ZOMBIE' : 'HUMAN'}
                  </div>
                </div>

                <div style={{ fontSize: '0.85em', color: '#888', margin: '2px 0 10px' }}>
                  @{item.screen_name}
                </div>
                
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