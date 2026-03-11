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

  // 🌟 【追加】使い方ガイドを表示するためのステート
  const [showGuide, setShowGuide] = useState(false);

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
  // 🌟 1. モードを記録するステートを追加
  const [isDemoMode, setIsDemoMode] = useState(true);
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
        // 🌟 2. バックエンドから届いたモードをセット
        setIsDemoMode(result.is_demo);
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

  // 🌟 3. JSXの中で「isDemoMode」の時だけ看板を出す！
  return (
    <div style={{ backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh', padding: '40px', fontFamily: 'monospace' }}>
      {/* 🌟 タイトルの変更だワン！🧟 IMPRESSION ZOMBIE CLEANER */}
      <h1 style={{ textAlign: 'center', color: '#00ff00', textShadow: '0 0 10px #00ff00', fontSize: '2.5em', fontWeight: '900' }}>
        🧟 IMPRESSION ZOMBIE CLEANER
      </h1>
      
      {/* 🌟 条件分岐！isDemoMode が true の時だけ表示される */}
      {/* 🌟 ここから デモ案内看板 */}
      {isDemoMode && (
        <div style={{
          maxWidth: '600px', 
          margin: '0 auto 30px',
          backgroundColor: 'rgba(0, 255, 0, 0.05)',
          border: '1px solid #00ff00',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'left',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.1)'
        }}>
          {/* 🌟 使い方ガイド（ツールチップ）の実装 */}
          <div 
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setShowGuide(true)}
            onMouseLeave={() => setShowGuide(false)}
          >
            <p style={{ margin: '0 0 10px 0', color: '#00ff00', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'help' }}>
              <span style={{ animation: 'pulse 2s infinite' }}>●</span> DEMO MODE ACTIVE ℹ️
            </p>
            
            {/* 🌟 カーソルを合わせた時に表示される使い方パネル */}
            {showGuide && (
              <div style={{
                position: 'absolute', top: '100%', left: '0', marginTop: '10px', width: '320px',
                background: '#000', border: '1px solid #00ff00', borderRadius: '8px', padding: '15px',
                zIndex: 10, boxShadow: '0 5px 15px rgba(0,255,0,0.3)', color: '#fff'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#00ff00', borderBottom: '1px solid #333', paddingBottom: '5px' }}>📖 アプリの使い方</p>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85em', lineHeight: '1.6', color: '#aaa' }}>
                  <li>下の <strong>Case A</strong> または <strong>Case B</strong> のボタンをクリックしてデモURLをセット。</li>
                  <li>入力欄の下にある <strong>「リプライ欄一括解析」</strong> ボタンをクリック！</li>
                  <li>一瞬で本物のゾンビ解析データが表示されます🐾</li>
                </ol>
              </div>
            )}
          </div>

          <p style={{ margin: '0 0 15px 0', fontSize: '0.85em', color: '#aaa', lineHeight: '1.6' }}>
            デモ用URLをポチッと押して、RUN BULK ANALYSISを押すだけで、本物のゾンビ解析データを体験できます！🐾
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* 🌟 Case A：改行バージョン + ホバー対応外部リンク */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setUrl("https://x.com/momonosekaiii/status/2029491573126574351")}
                style={{
                  flex: 1,
                  background: '#000',
                  color: '#00ff00',
                  border: '1px solid #333',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.75em',
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: '1.5',
                  transition: 'border-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#00ff00'}
                onMouseOut={(e) => e.target.style.borderColor = '#333'}
              >
                🐕💨 Case A 73 Replies (トイレットペーパーの芯からみてくる犬)<br />
                <span style={{ fontSize: '0.9em', color: '#666' }}>https://x.com/momonosekaiii/status/2029491573126574351</span>
              </button>
              {/* 🌟 ホバーで緑枠になる外部リンクボタン */}
              <button 
                onClick={() => window.open("https://x.com/momonosekaiii/status/2029491573126574351", '_blank')}
                style={{
                  background: '#000',
                  color: '#00ff00',
                  border: '1px solid #333',
                  padding: '0 15px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.7em',
                  fontWeight: 'bold',
                  transition: 'border-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#00ff00'}
                onMouseOut={(e) => e.target.style.borderColor = '#333'}
              >
                実際のツイートはこちら！🐾
              </button>
            </div>

            {/* 🌟 Case B：改行バージョン + ホバー対応外部リンク */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setUrl("https://x.com/inusankoinusan/status/2029180733114466495")}
                style={{
                  flex: 1,
                  background: '#000',
                  color: '#00ff00',
                  border: '1px solid #333',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.75em',
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: '1.5',
                  transition: 'border-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#00ff00'}
                onMouseOut={(e) => e.target.style.borderColor = '#333'}
              >
                🐕🌟 Case B 16 Replies (おもてなし犬)<br />
                <span style={{ fontSize: '0.9em', color: '#666' }}>https://x.com/inusankoinusan/status/2029180733114466495</span>
              </button>
              {/* 🌟 ホバーで緑枠になる外部リンクボタン */}
              <button 
                onClick={() => window.open("https://x.com/inusankoinusan/status/2029180733114466495", '_blank')}
                style={{
                  background: '#000',
                  color: '#00ff00',
                  border: '1px solid #333',
                  padding: '0 15px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.7em',
                  fontWeight: 'bold',
                  transition: 'border-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#00ff00'}
                onMouseOut={(e) => e.target.style.borderColor = '#333'}
              >
                実際のツイートはこちら！🐾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 入力エリア */}
      {/* 🌟 改善された入力・ボタンエリア */}
      <div style={{ maxWidth: '600px', margin: '0 auto 40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="解析するX(Twitter)のURLを入力..."
          style={{ width: '100%', padding: '16px', background: '#222', color: '#fff', border: '2px solid #00ff00', borderRadius: '8px', fontSize: '1.1em', boxSizing: 'border-box' }}
        />
        
        {/* ボタンを縦に並べるコンテナ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* ボタン1: リプライ欄一括解析 (メインアクションなので目立たせる) */}
          {/* 🌟 一括解析ボタン */}
          <button 
            onClick={fetchBulkAnalysis}
            disabled={loading}
            style={{ padding: '10px', background: '#00ff00', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', opacity: loading ? 0.7 : 1 }}
          >
            <span style={{ fontSize: '1.05em', fontWeight: '900' }}>
              {loading ? 'ANALYZING...' : '👥 リプライ欄一括解析 (RUN BULK ANALYSIS)'}
            </span>
            <span style={{ fontSize: '0.75em', opacity: 0.8, fontWeight: 'bold' }}>
              対象ツイートのURLを入力し、ぶら下がるリプライ最大100件を解析します
            </span>
          </button>

          {/* ボタン2: 個人アカウント解析 (サブアクションとしてデザインを分ける) */}
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            style={{ padding: '8px', background: '#000', color: '#00ff00', border: '1px solid #00ff00', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#0a2a0a'}
            onMouseOut={(e) => e.currentTarget.style.background = '#000'}
          >
            <span style={{ fontSize: '0.95em', fontWeight: 'bold' }}>
              {loading ? 'SCANNING...' : '👤 個人アカウント解析 (SCAN URL)'}
            </span>
            <span style={{ fontSize: '0.7em', color: '#aaa' }}>
              ユーザーのプロフィールURLを入力し、そのアカウント1件のみを判定します
            </span>
          </button>
          
        </div>
      </div>

      {/* ... (以下、解析結果表示と履歴表示のコードは以前と同じだワン！) */}
      {/* 🌟 D-2: 一括解析結果表示エリア */}
      {replies.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '40px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>
            <h2 style={{ margin: 0 }}>🛡️ DEFENSE LINE (REPLIES)</h2>
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
              <ReplyCard key={index} reply={reply} badge={getBadgeStyle(reply.badge_type, reply.verified)} />
            ))}
          </div>
        </div>
      )}

      {/* 3. 履歴表示エリア */}
      <div style={{ maxWidth: '900px', margin: '60px auto 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, color: '#00ff00' }}>📊 SCAN HISTORY (ARCHIVES)</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8em', color: '#00ff00' }}>
              FILTER: 
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ background: '#000', color: '#00ff00', border: '1px solid #00ff00', marginLeft: '8px', cursor: 'pointer' }}>
                <option value="all">SHOW ALL</option>
                <option value="zombie">ZOMBIES ONLY</option>
                <option value="human">HUMANS ONLY</option>
              </select>
            </div>
            <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '4px 12px', background: showHistory ? '#444' : '#00ff00', color: showHistory ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}>
              {showHistory ? 'HIDE HISTORY' : 'SHOW HISTORY'}
            </button>
          </div>
        </div>
        
        {showHistory && Object.keys(groupedHistory).map((sourceUrl, gIndex) => {
          const filteredItems = groupedHistory[sourceUrl].filter(item => {
            if (filter === 'zombie') return item.is_zombie;
            if (filter === 'human') return !item.is_zombie;
            return true;
          });
          if (filteredItems.length === 0) return null;
          return (
            <div key={gIndex} style={{ marginBottom: '40px', marginTop: '20px' }}>
              <div style={{ background: 'rgba(0, 255, 0, 0.05)', padding: '8px 15px', borderLeft: '4px solid #00ff00', marginBottom: '15px', fontSize: '0.8em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  SOURCE: <span style={{ color: '#00ff00' }}>{sourceUrl}</span>
                </span>
                <span style={{ color: '#666', marginLeft: '10px' }}>{filteredItems.length} items</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {filteredItems.map((item, index) => (
                  <ReplyCard key={index} reply={item} badge={getBadgeStyle(item.badge_type, item.verified)} />
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
  html, body {
    margin: 0;
    padding: 0;
    background-color: #1a1a1a; 
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 5px rgba(255,0,0,0.2); }
    50% { box-shadow: 0 0 15px rgba(255,0,0,0.4); }
    100% { box-shadow: 0 0 5px rgba(255,0,0,0.2); }
  }
`;
document.head.appendChild(styleTag);