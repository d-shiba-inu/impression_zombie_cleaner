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
              {/* 🌟 Rails側のロジックに合わせて表示 */}
              {reply.reply_lang !== reply.profile_lang && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffcc00' }}>
                  <span>🌐 Language Mismatch ({reply.reply_lang} vs {reply.profile_lang})</span>
                  <span>+30pt</span>
                </div>
              )}
              {/* 🌟 similarity_rateの計算に合わせた表示 */}
              {reply.similarity_rate > 0.4 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4444' }}>
                  <span>📋 High Similarity ({(reply.similarity_rate * 100).toFixed(0)}%)</span>
                  <span>+40pt</span>
                </div>
              )}
              {/* 🌟 投稿数の計算に合わせた表示 */}
              {reply.statuses_count > 50000 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                  <span>🤖 High Post Density</span>
                  <span>+15pt</span>
                </div>
              )}
              {/* 本文のコピペ疑い (Gemが is_copy_text などを返している場合) */}
              {reply.similarity_rate > 0.8 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4444' }}>
                  <span>📋 Critical Copy Content</span>
                  <span>+50pt</span>
                </div>
              )}
              {/* アカウントの作りたて判定 */}
              {new Date(reply.user_created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff8800' }}>
                  <span>👶 Newly Created Account</span>
                  <span>+20pt</span>
                </div>
              )}
              {/* フォロワーが極端に少ない（ゾンビによくある傾向） */}
              {reply.followers_count < 5 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff8800' }}>
                  <span>👤 Very Few Followers</span>
                  <span>+10pt</span>
                </div>
              )}
              {/* 🌟 その他（基本スコアなど）があれば追加 */}
              {(reply.score - ((reply.reply_lang !== reply.profile_lang ? 30 : 0) + (reply.similarity_rate > 0.4 ? 40 : 0) + (reply.statuses_count > 50000 ? 15 : 0))) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                  <span>🔍 Other Factors</span>
                  <span>+{reply.score - ((reply.reply_lang !== reply.profile_lang ? 30 : 0) + (reply.similarity_rate > 0.4 ? 40 : 0) + (reply.statuses_count > 50000 ? 15 : 0))}pt</span>
                </div>
              )}
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