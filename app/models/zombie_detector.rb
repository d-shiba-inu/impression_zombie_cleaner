# app/models/logic/zombie_detector.rb
class ZombieDetector
  # 判定に使うNGワードのリスト
  NG_WORDS = %w[副業 稼ぐ 収益 仮想通貨 プレゼント企画 公式 LINE 招待].freeze

  def initialize(user_data)
    @user = user_data
  end

  # 総合スコアを計算（0〜100点）
  def score
    points = 0
    points += check_ff_ratio
    points += check_keywords
    points += check_account_age
    [points, 100].min # 最大100点
  end

  private

  # 1. FF比のチェック（フォロー数が極端に多いと加点）
  def check_ff_ratio
    following = @user['following_count'].to_f
    followers = @user['followers_count'].to_f
    return 0 if followers == 0 # フォロワー0は判定不能

    ratio = following / followers
    # フォロー数がフォロワー数の1.5倍を超えたら怪しい
    ratio > 1.5 ? 40 : 0
  end

  # 2. NGワードのチェック
  def check_keywords
    description = @user['description'] || ""
    # 含まれているNGワードの数だけ加点
    count = NG_WORDS.count { |word| description.include?(word) }
    count * 20
  end

  # 3. アカウント作成日のチェック（最近すぎるのは怪しい）
  def check_account_age
    created_at = Time.parse(@user['created_at'])
    # 3ヶ月以内に作られたアカウントなら加点
    created_at > 3.months.ago ? 30 : 0
  end
end