# lib/zombie_detector/detector.rb
require 'time' # Railsの外では自分で呼ぶ必要がある

module ZombieDetector
  class Detector
    def initialize(data)
      @data = data
    end

    # 🌟 内訳をハッシュで返すメソッド
    def breakdown
      details = {
        age: check_account_age,          # 🌟 半年以内の新規 +10点
        ff_ratio: check_reciprocal_FF,   # 🌟 不自然なFF比 +10点 
        verified: check_verified_bonus,  # 🌟 青バッジ基本給 +15点
        density: check_activity_density, # 🌟 変異ゾンビ判定 (青天井)
        lang: check_lang_mismatch        # 🌟 言語ミスマッチ (最大40点)
      }

      total = details.values.sum
      { total: total, details: details }
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

    # 🌟 変異ゾンビ検知（投稿密度 × 年齢係数）
    def check_activity_density
      count = fetch('statuses_count').to_i
      created_at_str = fetch('user_created_at')
      return 0 if created_at_str.nil?

      begin
        created_at = Time.parse(created_at_str)
        
        # 経過日数と経過年数を計算
        days_active = [(Time.now - created_at) / 86400.0, 1.0].max
        years_active = days_active / 365.25
        
        # 1日あたりの平均ポスト数
        tweets_per_day = count.to_f / days_active

        # ① 一般人シールド（1日平均3ポストまでは無害化・0点）
        over_posts = [tweets_per_day - 3.0, 0.0].max

        # ② 基礎計算（オーバーした分 × 3.0点）し、上限40点で丸める
        base_score = [over_posts * 3.0, 40.0].min

        # ③ 年齢係数（古いほど青天井で倍率アップ）
        age_multiplier = 1.0 + (years_active * 0.25)

        # ④ 最終計算（基礎スコア × 年齢係数）
        # ※基礎が0なら、倍率が10倍でも0点のまま
        (base_score * age_multiplier).to_i
      rescue
        0
      end
    end

    # 🌟 言語ミスマッチ (最大40点)
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

      # 🌟 「母国語乖離スコア」のなめらかな勾配計算 (最大40点)
      non_ja_count = valid_langs.count { |l| l != 'ja' }
      mismatch_ratio = non_ja_count.to_f / valid_langs.size

      # 40点満点で、ミスマッチの度合いに合わせてグラデーションをつける
      (40 * mismatch_ratio).to_i
    end

    # アカウント作成が半年前以内
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

    # 相互フォロー水増し判定
    def check_reciprocal_FF
      followers = followers_count = fetch('followers_count').to_i
      following = following_count = fetch('following_count').to_i
      return 0 if following == 0
      # フォロワー数が一定以上で、FF比がほぼ 1:1 の場合に加点
      if followers >= 500 && (followers.to_f / following).between?(0.8, 1.2)
        10
      else
        0
      end
    end

    # ブルーバッジ加点 （青バッジ以外は人間か公式とみなす）
    def check_verified_bonus
      verified = fetch('verified')
      badge = fetch('badge_type').to_s
      
      # 全体ロジックで青バッジ以外は0倍にされるため、青バッジの時だけ15点を与える
      if (verified == true || verified == 'true') && badge == 'blue'
        15
      else
        0
      end
    end
  end
end