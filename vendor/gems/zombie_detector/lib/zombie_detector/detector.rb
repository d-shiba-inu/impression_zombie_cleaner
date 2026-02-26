# lib/zombie_detector/detector.rb
require 'time' # Railsの外では自分で呼ぶ必要がある

module ZombieDetector
  class Detector
    def initialize(user_data)
      @user = user_data
    end

    # 🌟 新しい：内訳をハッシュで返すメソッド
    def breakdown
      details = {
        age: check_account_age, # 10点
        ff_ratio: check_reciprocal_FF, # 15点
        verified: check_verified_bonus, # 15点
        density: check_activity_density, # 30点
        lang: check_lang_mismatch # 30点
      }
      total = [details.values.sum, 100].min
      { total: total, details: details } # 単体での合計スコア（最大100点に丸める）
    end

    # 🌟 scoreメソッドもbreakdownを使うようにしてスリムに
    def score
      breakdown[:total]
    end

    private

    # 🌟 キーが文字列でもシンボルでも取得できる補助メソッド
    def fetch(key)
      @user[key.to_s] || @user[key.to_sym]
    end

    # 🌟新設①: 投稿密度（1日平均の投稿数）
    def check_activity_density
      count = fetch('statuses_count').to_i
      created_at_str = fetch('user_created_at')
      return 0 if created_at_str.nil?

      begin
        created_at = Time.parse(created_at_str)
        # 経過日数を算出（最低1日とする）
        days_active = [(Time.now - created_at) / 86400, 1].max
        tweets_per_day = count.to_f / days_active

        # 1日平均 50投稿以上で 15点、100投稿以上で 30点（人間離れ判定）
        if tweets_per_day > 100
          30
        elsif tweets_per_day > 50
          15
        else
          0
        end
      rescue
        0
      end
    end

    # 🌟新設②: 言語ミスマッチ
    def check_lang_mismatch
      reply_lang = fetch('reply_lang')
      profile_lang = fetch('profile_lang')

      # 本文が日本語(ja)なのに、プロフが日本語以外（かつ判定不能以外）なら加点
      if reply_lang == 'ja' && profile_lang != 'ja' && profile_lang != 'un'
        30
      else
        0
      end
    end

    # 条件2: アカウント作成が半年前以内
    def check_account_age
      created_at_str = fetch('user_created_at') # 統一して user_created_at を見る
      return 0 if created_at_str.nil?
      begin
        created_at = Time.parse(created_at_str)
        (Time.now - created_at) < 180 * 24 * 60 * 60 ? 10 : 0
      rescue
        0
      end
    end

    # 条件3: 相互フォロー水増し判定
    def check_reciprocal_FF
      followers = fetch('followers_count').to_i
      following = fetch('following_count').to_i
      return 0 if following == 0
      if followers >= 500 && (followers.to_f / following).between?(0.8, 1.2)
        15
      else
        0
      end
    end

    # 条件4: ブルーバッジ加点
    def check_verified_bonus
      val = fetch('verified')
      (val == true || val == "true") ? 15 : 0
    end
  end
end