import React, { useState, useEffect } from 'react'; // 🌟 useEffect を追加
import { ReplyCard } from './ReplyCard';

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

  // 🌟 フィルターと表示切替のステート
  const [filter, setFilter] = useState('all'); // 'all', 'zombie', 'human'
  const [showHistory, setShowHistory] = useState(true);

  // 🌟 ページ読み込み時に実行される魔法
  useEffect(() => {
    fetchHistory();
  }, []);

  // 🌟 【追加】RailsのDBから履歴を取得する関数
  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/v1/analyses/history');
      const result = await response.json();
      if (result.status === 'success') {
        setHistory(result.data); // DBのデータをセット
      }
    } catch (error) {
      console.error("履歴のロードに失敗だワン... 😢", error);
    }
  };

  // 🌟 解析ごとにデータをグループ化するロジック（URLをキーにする）
  const groupedHistory = history.reduce((acc, item) => {
    const key = item.url || "Unknown Scan";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // 1. 【一括判定ボタン】の実装
  const fetchBulkAnalysis = async () => {
    if (!url) return alert("解析したいポストのURLを入力してほしいワン！🐶");
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/analyses?url=${encodeURIComponent(url)}`);
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
      const response = await fetch('/api/v1/analyses', {
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
      
      {/* 🌟 ここから デモ案内看板 */}
      <div style={{
        maxWidth: '600px', // 入力欄と同じ幅に合わせる
        margin: '0 auto 30px',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        border: '1px dashed #00ff00',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'left'
      }}>
        <p style={{ margin: '0 0 10px 0', color: '#00ff00', fontWeight: 'bold' }}>
          🐾 デモ解析モード稼働中だワン！
        </p>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.85em', color: '#ccc', lineHeight: '1.6' }}>
          現在はベータ版のため、特定のURLのみ解析可能です。<br />
          下のボックスに貼り付けて「RUN BULK ANALYSIS」を押してください！
        </p>
        <code style={{ 
          display: 'block', 
          background: '#000', 
          padding: '10px', 
          borderRadius: '4px', 
          color: '#00ff00',
          fontSize: '0.8em',
          wordBreak: 'break-all',
          border: '1px solid #333'
        }}>
          https://x.com/minogashi205/status/2025474554320314713
        </code>
      </div>

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
            {visibleReplies.map((reply, index) => (
              <ReplyCard 
                key={index} 
                reply={reply} 
                badge={getBadgeStyle(reply.badge_type, reply.verified)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. 履歴表示エリア */}
      <div style={{ maxWidth: '900px', margin: '60px auto 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, color: '#00ff00' }}>📊 SCAN HISTORY (ARCHIVES)</h2>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* 🌟 フィルターセレクトボックス */}
            <div style={{ fontSize: '0.8em', color: '#00ff00' }}>
              FILTER: 
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                style={{ background: '#000', color: '#00ff00', border: '1px solid #00ff00', marginLeft: '8px', cursor: 'pointer' }}
              >
                <option value="all">SHOW ALL</option>
                <option value="zombie">ZOMBIES ONLY</option>
                <option value="human">HUMANS ONLY</option>
              </select>
            </div>

            {/* 🌟 表示トグルボタン */}
            <button 
              onClick={() => setShowHistory(!showHistory)}
              style={{ padding: '4px 12px', background: showHistory ? '#444' : '#00ff00', color: showHistory ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
            >
              {showHistory ? 'HIDE HISTORY' : 'SHOW HISTORY'}
            </button>
          </div>
        </div>
        
        {history.length === 0 && <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>まだスキャン履歴はありません。</p>}
        
        {/* 🌟 履歴全体の表示スイッチ (showHistory) */}
        {showHistory && Object.keys(groupedHistory).map((sourceUrl, gIndex) => {
          // 🌟 フィルターを適用したアイテムを先に作成
          const filteredItems = groupedHistory[sourceUrl].filter(item => {
            if (filter === 'zombie') return item.is_zombie;
            if (filter === 'human') return !item.is_zombie;
            return true;
          });

          // このグループに表示すべきものがない場合はスキップ
          if (filteredItems.length === 0) return null;

          return (
            <div key={gIndex} style={{ marginBottom: '40px', marginTop: '20px' }}>
              {/* 🌟 解析ごとの区切り見出し */}
              <div style={{ 
                background: 'rgba(0, 255, 0, 0.05)', 
                padding: '8px 15px', 
                borderLeft: '4px solid #00ff00', 
                marginBottom: '15px',
                fontSize: '0.8em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  SOURCE: <span style={{ color: '#00ff00' }}>{sourceUrl}</span>
                </span>
                <span style={{ color: '#666', marginLeft: '10px' }}>{filteredItems.length} items</span>
              </div>

              {/* 🌟 一括解析結果（DEFENSE LINE）とデザインを統一したグリッド */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {filteredItems.map((item, index) => (
                  <ReplyCard 
                    key={index} 
                    reply={item} 
                    badge={getBadgeStyle(item.badge_type, item.verified)} 
                  />
                ))}
              </div>
            </div>
          );
        })}
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