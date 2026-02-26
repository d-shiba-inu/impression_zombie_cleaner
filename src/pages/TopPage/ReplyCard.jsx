// 🌟 カード1枚分を独立した部品にするワン！
import React, { useState } from 'react';

export const ReplyCard = ({ reply, badge }) => {
  const [showDetail, setShowDetail] = useState(false); // 🌟 ここでならuseStateを使ってもOK！
  const isZombie = reply.is_zombie_copy || reply.is_zombie;

  const cardStyle = {
    padding: '12px',
    background: isZombie ? 'rgba(255, 0, 0, 0.15)' : '#222',
    border: isZombie ? '1px solid #ff0000' : '1px solid #444',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
    animation: isZombie ? 'pulse 2s infinite' : 'none'
  };

  return (
    <div style={cardStyle}>
      {/* 投稿者情報 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '8px', overflow: 'hidden' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {reply.name}
          </div>
          {reply.verified && <span style={{ color: badge.color }}>{badge.icon}</span>}
          <div style={{ fontSize: '0.8em', color: '#888' }}>@{reply.screen_name}</div>
        </div>
        {/* 右上のスコア */}
        <div style={{ 
          fontSize: '0.85em', 
          fontWeight: 'bold', 
          color: isZombie ? '#ff0000' : '#00ff00',
          border: `1px solid ${isZombie ? '#ff0000' : '#444'}`,
          padding: '2px 6px',
          borderRadius: '4px',
          flexShrink: 0
        }}>
          {reply.score}pt
        </div>
      </div>

      <p style={{ fontSize: '0.9em', margin: '12px 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
        {reply.text}
      </p>

      {/* 判定理由のトグル */}
      <div style={{ borderTop: '1px solid #333', paddingTop: '8px', marginTop: '10px' }}>
        <button 
          onClick={() => setShowDetail(!showDetail)}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.75em', cursor: 'pointer', padding: '0' }}
        >
          {showDetail ? '▼ HIDE REASON' : '▶ SHOW REASON'}
        </button>

        {showDetail && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            background: 'rgba(0,0,0,0.4)', 
            borderRadius: '6px',
            border: '1px dashed #444'
          }}>
            {/* 1. 合計点数 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ fontSize: '0.7em', color: '#00ff00' }}>TOTAL RISK SCORE</span>
              <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: isZombie ? '#ff0000' : '#00ff00' }}>{reply.score}pt</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75em' }}>
            {/* 2. 加点項目とそれぞれの点数 */}
              {/* 🌟 A. コピペ判定 (GemのDuplicateCheckerが計算したもの) */}
              {reply.similarity_rate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4444' }}>
                  <span>📋 Content Similarity ({(reply.similarity_rate * 100).toFixed(0)}%)</span>
                  <span>+{Math.floor(reply.similarity_rate * 50)}pt</span>
                </div>
              )}

              {/* 🌟 B. Railsから届いた内訳 (breakdown) を自動で並べるワン！ */}
              {reply.breakdown && Object.entries(reply.breakdown).map(([key, val]) => {
                if (val === 0) return null; // 0点の項目は出さない

                // キー名を人間が見やすい名前に変換する辞書だワン
                const labels = {
                  age: "🐣 Account Age Risk",
                  ff_ratio: "👥 Reciprocal FF Ratio",
                  verified: "💎 Verified Blue Bonus",
                  density: "🤖 Post Activity Density",
                  lang: "🌐 Language Mismatch"
                };

                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                    <span>{labels[key] || key.toUpperCase()}</span>
                    <span>+{val}pt</span>
                  </div>
                );
              })}

              {/* 🌟 C. 端数調整がある場合 (Gemの合計点と内訳の合計に差がある時) */}
              {(() => {
                const breakdownSum = reply.breakdown ? Object.values(reply.breakdown).reduce((a, b) => a + b, 0) : 0;
                const jaccardScore = reply.similarity_rate ? Math.floor(reply.similarity_rate * 50) : 0;
                const diff = reply.score - (breakdownSum + jaccardScore);
                
                if (diff !== 0) {
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontStyle: 'italic', borderTop: '1px solid #333', paddingTop: '4px' }}>
                      <span>🔍 Other Adjustments</span>
                      <span>{diff > 0 ? `+${diff}` : diff}pt</span>
                    </div>
                  );
                }
              })()}
            {/* 3. 何も加点がない場合 */}
              {reply.score === 0 && (
                <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No risk factors detected.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};