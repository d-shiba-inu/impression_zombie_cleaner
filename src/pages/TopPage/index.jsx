import React, { useState } from 'react'; // 1. useStateをインポート

export const TopPage = () => {
  // 2. 記憶エリア（State）を作成
  const [url, setUrl] = useState(''); // 入力されたURL
  const [result, setResult] = useState(''); // 解析結果のメッセージ

  // 3. ボタンを押した時の動き
  const handleAnalyze = () => {
    if (!url) {
      alert("URLを入力してほしいワン！🐶");
      return;
    }
    setResult(`「${url}」を解析中... 🧟‍♂️ しばらくお待ちください...`);
    
    // ここに将来、Rails（バックエンド）にお願いする処理を書きます
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>🧟‍♂️ ゾンビURL解析アプリ</h1>
      <p>放置された「ゾンビURL」をクリーンアップしましょう！</p>
      
      <div style={{ margin: '20px 0' }}>
        <input 
          type="text" 
          placeholder="https://example.com" 
          value={url} // Stateと紐付け
          onChange={(e) => setUrl(e.target.value)} // 文字が入るたびにStateを更新
          style={{ padding: '10px', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        <button 
          onClick={handleAnalyze} // クリック時に実行
          style={{ padding: '10px 20px', marginLeft: '10px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          解析開始！
        </button>
      </div>

      {/* 4. 結果を表示するエリア */}
      {result && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px', border: '1px dashed #666' }}>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};