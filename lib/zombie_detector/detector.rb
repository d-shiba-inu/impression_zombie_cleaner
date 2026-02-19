# lib/zombie_detector/detector.rb
require 'time' # Railsの外では自分で呼ぶ必要がある

module ZombieDetector
  class Detector
    NG_WORDS = %w[副業 稼ぐ 収益 仮想通貨 プレゼント企画 公式 LINE 招待].freeze

    def initialize(user_data)
      @user = user_data
    end

    def score
      points = 0
      points += check_ff_ratio
      points += check_keywords
      points += check_account_age
      [points, 100].min
    end

    private

    def check_ff_ratio
      following = @user['following_count'].to_f
      followers = @user['followers_count'].to_f
      return 0 if followers == 0
      (following / followers) > 1.5 ? 40 : 0
    end

    def check_keywords
      description = @user['description'] || ""
      NG_WORDS.count { |word| description.include?(word) } * 20
    end

    def check_account_age
      # 🌟 Railsの 3.months.ago は使えないので、Ruby標準の秒数計算にする
      created_at = Time.parse(@user['created_at'])
      three_months_in_seconds = 3 * 30 * 24 * 60 * 60 # およそ3ヶ月
      (Time.now - created_at) < three_months_in_seconds ? 30 : 0
    end
  end
end