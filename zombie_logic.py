# zombie_logic.py
def calculate_score(verified, follower_count):
    # バッジなしなら 0点！
    if not verified:
        return 0
    
    # バッジありなら、フォロワー数に応じて計算 (例)
    score = 50 + (follower_count / 1000)
    return min(score, 100) # 最大100点にする

# テスト実行
print(f"バッジなしの人: {calculate_score(False, 5000)}点")
print(f"バッジありの人: {calculate_score(True, 10000)}点")