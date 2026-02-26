# zombie_detector/lib/zombie_detector.rb
# Gemが読み込まれたときにいちばん最初に読み込まれるファイル
# gem 'zombie_detector' と書いたときに、RubyGemsは自動的に lib/zombie_detector.rb(Gemの名前.rb) を探しに行くルール（規約）がある

require "zombie_detector/version"
require "zombie_detector/detector"
require "zombie_detector/duplicate_checker"

module ZombieDetector
  class << self
    # ショートカットメソッド: ZombieDetector.score(user_data) で呼べるようにする
    # アカウント単体判定（FF比など）
    def score(user_data)
      Detector.new(user_data).score # Detector側のメソッド名に合わせて調整
    end

    # リプライ一覧をまとめてゾンビ判定する
    # ZombieDetector.detect_duplicates(replies) で呼べるようにする
    def detect_duplicates(replies)
      DuplicateChecker.new(replies).analyze
    end

    # ゾンビかどうかを真偽値で返すメソッド
    def zombie?(user_data)
      score(user_data) >= 60
    end
  end
end