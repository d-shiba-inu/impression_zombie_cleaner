import json

def process_zombies(json_input):
    # JSON文字列を Python のリスト（配列）に変換する
    data = json.loads(json_input)
    
    for user in data:
        # さっきの判定ロジックを使う
        is_verified = user.get('verified', False)
        followers = user.get('follower_count', 0)
        
        # スコアを計算して、データに書き込む
        if not is_verified:
            user['score'] = 0
        else:
            user['score'] = min(50 + (followers / 1000), 100)
            
    # 計算が終わったデータを、再び JSON 文字列に戻して返す
    return json.dumps(data, ensure_ascii=False)

# テスト用のデータ（Railsから送られてくる想定）
test_json = '[{"name": "Zombieman", "verified": false, "follower_count": 5000}, {"name": "VerifiedGuy", "verified": true, "follower_count": 10000}]'

print("--- 調理開始ワン！ ---")
print(process_zombies(test_json))