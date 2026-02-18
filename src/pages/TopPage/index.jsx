import React from 'react';

export const TopPage = () => { // defaultを付けず、名前付きにする
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🧟‍♂️ ゾンビURL解析アプリ</h1>
      <p>ついに...つながりましたね！✨</p>
      <input type="text" placeholder="https://example.com" />
      <button>解析開始！</button>
    </div>
  );
};