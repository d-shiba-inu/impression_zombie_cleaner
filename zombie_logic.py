import json
import sys

# 標準入力（sys.stdin）から Rails が送ってきたデータを受け取る
input_data = sys.stdin.read()

def process_zombies(json_input):
    try:
        data = json.loads(json_input)
        for user in data:
            is_verified = user.get('verified', False)
            followers = user.get('follower_count', 0)
            user['score'] = 0 if not is_verified else min(50 + (followers / 1000), 100)
        return json.dumps(data, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})

# 実行して結果を標準出力に書き出す
print(process_zombies(input_data))