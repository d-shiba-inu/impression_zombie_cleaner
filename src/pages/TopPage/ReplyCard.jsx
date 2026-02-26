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
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.75em', color: '#aaa' }}>
            {reply.reply_lang !== reply.profile_lang && (
              <div>・Language mismatch ({reply.reply_lang} vs {reply.profile_lang})</div>
            )}
            {reply.similarity_rate > 0.4 && (
              <div>・High text similarity ({(reply.similarity_rate * 100).toFixed(1)}%)</div>
            )}
            <div>・Account Activity: {reply.statuses_count} posts</div>
          </div>
        )}
      </div>
    </div>
  );
};