# lib/zombie_detector/detector.rb
require 'time' # Railsの外では自分で呼ぶ必要がある

module ZombieDetector
  class Detector
    def initialize(data)
      @data = data
    end

    # 🌟 新しい：内訳をハッシュで返すメソッド
    def breakdown
      details = {
        age: check_account_age, # 10点
        ff_ratio: check_reciprocal_FF, # 15点
        verified: check_verified_bonus, # 15点 (🌟 金・銀バッジはここで減点・救済するワン！)
        density: check_activity_density, # 30点 (🌟 バッジ×高密度のコンボ加点を追加したワン！)
        lang: check_lang_mismatch # 30点 (🌟 勾配・グラデーション計算に強化したワン！)
      }
      # 🌟 各項目の配点を調整しつつ、最大100点に丸める
      total = [details.values.sum, 100].min
      { total: total, details: details } # 単体での合計スコア
    end

    # 🌟 scoreメソッドもbreakdownを使うようにしてスリムに
    def score
      # 負のスコア（救済措置）で合計がマイナスにならないよう 0 で下限設定
      [breakdown[:total], 0].max
    end

    private

    # 🌟 キーが文字列でもシンボルでも取得できる補助メソッド
    def fetch(key)
      @data[key.to_s] || @data[key.to_sym]
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

        # 🌟 若さ係数
        age_multiplier = if days_active < 90
                           1.5
                         else
                           1.0
                         end

        # 🌟 勾配計算 (100件/日で30点になるように 0.3 を掛ける)
        raw_score = (tweets_per_day * 0.3 * age_multiplier).to_i
        density_points = [raw_score, 30].min

        # 🚀 🌟 強化：バッジ持ち × 高頻度投稿(1日50件以上) のコンボ加点
        # 青バッジのインプレゾンビを確実に捕まえるための +15点
        combo_bonus = (fetch('badge_type') == 'blue' && tweets_per_day > 50) ? 15 : 0

        density_points + combo_bonus
      rescue
        0
      end
    end

    # 🌟新設②: 言語ミスマッチ (🌟 グラデーション・勾配版に進化！)
    def check_lang_mismatch
      reply_lang = fetch('reply_lang').to_s
      return 0 unless reply_lang == 'ja' # 本文が日本語(ja)の時だけ判定する

      # 母国語の判定材料を集めるワン
      sources = {
        profile_setting: fetch('profile_lang'),
        pinned_tweet:    fetch('pinned_tweet_lang'),
        description:     fetch('description')
      }

      # 判定材料から「日本語(ja)」の気配を探す
      valid_langs = [sources[:profile_setting], sources[:pinned_tweet]].compact.reject { |l| l == 'un' || l == '' }
      
      # プロフ本文に日本語が含まれているかチェック
      has_jp_in_desc = sources[:description].to_s.match?(/[一-龠ぁ-んァ-ヶ]/)
      valid_langs << 'ja' if has_jp_in_desc

      # 判定材料が全くない場合は 0点
      return 0 if valid_langs.empty?

      # 🌟 「母国語乖離スコア」のなめらかな勾配計算 (最大30点)
      non_ja_count = valid_langs.count { |l| l != 'ja' }
      mismatch_ratio = non_ja_count.to_f / valid_langs.size

      # 30点満点で、ミスマッチの度合いに合わせてグラデーションをつける
      (30 * mismatch_ratio).to_i
    end

    # 条件2: アカウント作成が半年前以内
    def check_account_age
      created_at_str = fetch('user_created_at')
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
      followers = followers_count = fetch('followers_count').to_i
      following = following_count = fetch('following_count').to_i
      return 0 if following == 0
      # フォロワー数が一定以上で、FF比がほぼ 1:1 の場合に加点
      if followers >= 500 && (followers.to_f / following).between?(0.8, 1.2)
        15
      else
        0
      end
    end

    # 条件4: ブルーバッジ加点 (🌟 金・銀バッジのホワイトリスト機能追加！)
    def check_verified_bonus
      verified = fetch('verified')
      return 0 unless (verified == true || verified == "true")

      badge = fetch('badge_type').to_s
      case badge
      when 'gold', 'government'
        -50 # 🌟 企業や政府公式はホワイトリスト（大幅減点）にする
      when 'blue'
        15  # 青バッジはインプレゾンビの可能性があるから加点
      else
        15  # 種類が不明な場合も一応加点
      end
    end
  end
end