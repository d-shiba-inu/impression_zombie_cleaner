import React, { useState } from 'react';

export const TopPage = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false); // 読み込み中かどうか

  const handleAnalyze = async () => { // async を付ける
    if (!url) return alert("URLを入力してほしいワン！🐶");

    setLoading(true);
    setResult('Railsに問い合わせ中... 🧟‍♂️');

    try {
      // 🚀 ここが Rails への通信！
      const response = await fetch('http://localhost:3000/api/v1/analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }), // 入力したURLをJSONにして送る
      });

      const data = await response.json(); // Railsからの返事（JSON）を解析
      setResult(data); // Railsから届いたオブジェクトを保存！
      
    } catch (error) {
      console.error('通信エラー:', error);
      setResult('Railsくんが反応してくれないみたいだワン... 😢');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🧟‍♂️ ゾンビURL解析アプリ</h1>
      <div style={{ margin: '20px 0' }}>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="https://example.com"
          style={{ padding: '10px', width: '300px' }}
        />
        <button onClick={handleAnalyze} disabled={loading} style={{ padding: '10px 20px', marginLeft: '10px' }}>
          {loading ? '解析中...' : '解析開始！'}
        </button>
      </div>
      {result && result.data && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', border: '2px solid #333' }}>
          <h2 style={{ color: result.data.is_zombie ? 'red' : 'green' }}>
            {result.data.is_zombie ? '🧟‍♂️ ゾンビ判定！' : '👤 人間判定！'}
          </h2>
          <p><strong>ID:</strong> @{result.data.screen_name}</p>
          <p><strong>自己紹介:</strong> {result.data.description || '（未設定）'}</p>
          <p><strong>FF比:</strong> {result.data.followers_count} / {result.data.following_count}</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            スコア: {result.data.score}点
          </div>
        </div>
      )}
    </div>
  );
};