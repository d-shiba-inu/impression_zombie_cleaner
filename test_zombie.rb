# test_zombie.rb
require_relative 'lib/zombie_detector/detector'
require_relative 'lib/zombie_detector/duplicate_checker'

# --- テストケース ---
test_data = [
  {
    'text' => 'おはよう', # 短文のコピペ
    'user_created_at' => (Time.now - 365*86400).to_s, # 1年前
    'statuses_count' => 5000,
    'reply_lang' => 'ja', 'profile_lang' => 'ja', 'created_at' => Time.now.to_s
  }
]

# 実行
checker = ZombieDetector::DuplicateChecker.new(test_data)
puts checker.analyze
