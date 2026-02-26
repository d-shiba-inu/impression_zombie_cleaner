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

            {/* 2 & 3. 加点項目とそれぞれの点数 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75em' }}>
              {/* 言語判定 */}
              {reply.reply_lang !== reply.profile_lang && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffcc00' }}>
                  <span>🌐 Lang Mismatch ({reply.reply_lang} vs {reply.profile_lang})</span>
                  <span>+30pt</span>
                </div>
              )}

              {/* 類似度判定 */}
              {reply.similarity_rate > 0.4 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4444' }}>
                  <span>📋 High Similarity ({(reply.similarity_rate * 100).toFixed(1)}%)</span>
                  <span>+40pt</span>
                </div>
              )}

              {/* 🌟 メトリクス判定（Other Factors の正体！） */}
              {reply.followers_count < 10 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff8800' }}>
                  <span>👤 Low Followers ({reply.followers_count})</span>
                  <span>+15pt</span>
                </div>
              )}

              {reply.statuses_count > 50000 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4444' }}>
                  <span>🤖 Bot-like Activity ({reply.statuses_count.toLocaleString()} posts)</span>
                  <span>+20pt</span>
                </div>
              )}

              {/* 🌟 5. 【追加】バッジと名前の矛盾判定 (Gemの隠しルール) */}
              {reply.verified && reply.score > 50 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3399ff' }}>
                  <span>💎 Blue Badge Risk (High score despite Verified)</span>
                  <span>+10pt</span>
                </div>
              )}

              {/* 🌟 6. 【追加】プロフィール文の薄さ判定 */}
              {(!reply.description || reply.description.length < 10) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                  <span>📄 Empty/Short Description</span>
                  <span>+5pt</span>
                </div>
              )}

              {/* 🌟 7. 【追加】アカウント作成からの経過時間（新しすぎる場合） */}
              {new Date(reply.user_created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff00ff' }}>
                  <span>🐣 Ultra Fresh Account (under 7 days)</span>
                  <span>+25pt</span>
                </div>
              )}

              {/* 最終手段：これでも余る端数がある場合（最小単位の調整用） */}
              {(() => {
                const known = 
                  (reply.reply_lang !== reply.profile_lang ? 30 : 0) + 
                  (reply.similarity_rate > 0.4 ? 40 : 0) +
                  (reply.followers_count < 10 ? 15 : 0) +
                  (reply.statuses_count > 50000 ? 20 : 0) +
                  (reply.verified && reply.score > 50 ? 10 : 0) +
                  (!reply.description || reply.description.length < 10 ? 5 : 0) +
                  (new Date(reply.user_created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 25 : 0);
                
                const mystery = reply.score - known;
                if (mystery !== 0) {
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444', fontStyle: 'italic', borderTop: '1px solid #333' }}>
                      <span>🔍 Misc. Neural Weights</span>
                      <span>{mystery > 0 ? `+${mystery}` : mystery}pt</span>
                    </div>
                  );
                }
                return null;
              })()}
              {/* 何も加点がない場合 */}
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