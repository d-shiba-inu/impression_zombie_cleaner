# app/controllers/api/v1/analyses_controller.rb
class Api::V1::AnalysesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # テスト用JSONを読み込んで一括解析するアクション
  # 🌟 本番用の一括解析アクション
  def index
    # 1. フロントから届いた URL を解析して Tweet ID を抜き出す
    # 例: https://x.com/username/status/123456789 -> 123456789
    tweet_url = params[:url]
    # 🌟 デモ用の特定のURL
    demo_urls = [
      "https://x.com/momonosekaiii/status/2029491573126574351",
      "https://x.com/inusankoinusan/status/2029180733114466495"
    ]        # "2025474554320314713" イケメンマッチョ犬ツイートのID
    
    # A. デモモードかつ、知らないURLが来たらブロックする
    is_demo = ENV['DEMO_MODE'] == 'true'
    if is_demo && !demo_urls.any? { |url| tweet_url.include?(url) }
      render json: { 
        status: 'error', 
        message: '現在はデモ期間中につき、特定のURLのみ解析可能です。履歴から過去の解析結果を見るか、デモ用URLを試してほしいワン！🐾' 
      }, status: :forbidden
      return
    end

    # B. デモ用URLが来たら、APIを叩かずにDBから取得して返す
    if is_demo
    # URLが完全一致するか、クエリパラメータを除いた部分で一致するものを探す
    base_url = tweet_url.split('?').first
    stored_analyses = Analysis.where("url LIKE ?", "%#{base_url}%").order(created_at: :desc)

    if stored_analyses.any?
      # 🚀 DBのデータを、魔法の箱(apply_latest_logic)で再計算！
      @results = apply_latest_logic(stored_analyses.map(&:attributes))

      render json: {
        status: 'success',
        message: "デモ用データの取得に成功したワン！🐾",
        data: @results, # 🌟 カンマ忘れないワン！
        is_demo: ENV['DEMO_MODE'] == 'true' # 🌟 React側にモードを伝えるワン
      }
      return
    end
  end

    if tweet_url.blank?
      render json: { status: 'error', message: 'URLが空だワン！🐶' }, status: :bad_request
      return
    end

    # 正規表現で ID 部分だけをスマートに抽出（スリムな実装）
    tweet_id = tweet_url.match(%r{status/(\d+)})&.[](1)

    if tweet_id.nil?
      render json: { status: 'error', message: '有効なTweet URLじゃないみたいだワン...😢' }, status: :unprocessable_entity
      return
    end

    # 2. X API から本物のリプライを 100件取得
    client = XApi::Client.new

    puts "DEBUG: Token exists? #{ENV['X_BEARER_TOKEN'].present?}"
    puts "DEBUG: Fetching replies for ID: #{tweet_id}"

    post_author_id = client.fetch_tweet_author_id(tweet_id) # 🌟 まず「投稿主のID」を特定する
    raw_replies = client.fetch_replies(tweet_id, post_author_id) # 🌟 引数に post_author_id を渡す！

    puts "DEBUG: API returned #{raw_replies&.size || 0} replies after filtering author."
    
    if raw_replies.nil? || raw_replies.empty?
      # 🌟 何も取れなかった時は、ちゃんとメッセージを返すワン！
      render json: { 
        status: 'success', 
        data: [], 
        message: "リプライが見つからなかったワン...😢（7日以上前のポストは解析できない制限があるワン）",
        is_demo: ENV['DEMO_MODE'] == 'true'
      }
      return
    end

    return render json: { status: 'success', data: [], is_demo: ENV['DEMO_MODE'] == 'true' } if raw_replies.empty?

    puts "DEBUG: Raw Replies Count: #{raw_replies&.size}"

    # 🌟 Gemの結果に内訳を付ける処理を共通化
    @results = apply_latest_logic(raw_replies)

    # 🌟 4. 判定結果を DB に一括保存（バルク・インサート）
    # map を使って保存用のデータ配列をスリムに作成します
    save_data = @results.map do |res|
      {
        url: tweet_url,
        name: res['name'],
        screen_name: res['screen_name'],
        text: res['text'],
        similarity_rate: res['similarity_rate'] || 0,
        is_zombie: res['is_zombie'], # Gemのキー名に合わせる
        verified: res['verified'],
        badge_type: res['badge_type'],
        description: res['description'],
        score: res['score'],
        reply_lang: res['reply_lang'],     
        profile_lang: res['profile_lang'], 
        breakdown: res['breakdown'], # 🌟 内訳ハッシュをJSON文字列にして保存
        followers_count: res['followers_count'], # 🌟 追加！
        following_count: res['following_count'], # 🌟 追加！
        statuses_count:  res['statuses_count'],  # 🌟 追加！
        user_created_at: res['user_created_at'], # 🌟 追加！
        created_at: Time.current,
        updated_at: Time.current
      }
    end
    
    # 🌟 保存直前にデータを 1 件だけ手動でテスト保存してみるワン！
    if save_data.any?
      test_record = Analysis.new(save_data.first)
      unless test_record.valid?
        puts "❌ バリデーションエラーだワン！: #{test_record.errors.full_messages}"
      end
      
      begin
        # 実際に DB に書いてみて、エラーをコンソールに吐き出すワン
        Analysis.create!(save_data.first)
        puts "✅ 1件目のテスト保存に成功したワン！"
      rescue => e
        puts "🔥 DB保存エラー発生だワン！！: #{e.message}"
      end
    end

    # 🌟 Rails 6以降の爆速保存メソッド
    Analysis.insert_all(save_data) if save_data.any?

    # 🌟 React に @results（内訳付き）を返す
    render json: {
      status: 'success',
      message: "#{raw_replies.size}件を解析・保存したワン！🐾",
      data: @results, # 🌟 カンマ忘れないワン！
      is_demo: ENV['DEMO_MODE'] == 'true' # 🌟 ここもセットだワン
    }
  end

  # 特定のユーザー1人を検証するアクション
  def create
    username = params[:url]
    client = XApi::Client.new
    user_data = client.fetch_user_data(username)

    if user_data.nil?
      render json: { 
        status: 'error', 
        message: 'ユーザーが見つからなかったワン...🐶' 
      }, status: :not_found
      return
    end

    # 1. 自作Gemで判定（既存ロジック）
    # 🌟 ここで Detector インスタンスを作る
    detector = ZombieDetector::Detector.new(user_data)
    # 🌟 detector インスタンスからスコアを取るように修正したワン！
    zombie_score = detector.score
    is_zombie = zombie_score >= 60 # 判定（60点以上をゾンビとする）

    # 2. 🌟 檻（DB）に保存する
    # analysis_params を通さず、ここで明示的にマッピングします
    @analysis = Analysis.new(
      url: "https://x.com/#{user_data['screen_name']}", # 単体スキャンなのでプロフィールURL
      name: user_data['name'] || "Unknown",
      screen_name: user_data['screen_name'],
      text: "", # プロフィールスキャンなので本文は空
      score: zombie_score,
      is_zombie: is_zombie,
      verified: !!user_data['verified'],
      badge_type: user_data['badge_type'],
      description: user_data['description'],
      followers_count: user_data['followers_count'],
      following_count: user_data['following_count'],
      statuses_count:  user_data['statuses_count'],
      user_created_at: user_data['user_created_at'],
      breakdown: detector.breakdown[:details] # Analysis.newなら .to_json は自動でやってくれる
    )

    # 3. 保存に成功したら React に返す
    if @analysis.save
      render json: {
        status: 'success',
        message: "DBへの保存に成功したワン！🐾",
        data: @analysis # 保存されたデータ（ID付き）を返す
      }
    else
      render json: {
        status: 'error',
        message: 'DB保存に失敗しちゃったワン...😢',
        errors: @analysis.errors.full_messages
      }, status: :internal_server_error
    end
  end

  # 履歴取得用のアクション
  def history
    demo_id = "2025474554320314713"
    
    # 1. データの取得
    if ENV['DEMO_MODE'] == 'true'
      # momonosekaiii と inusankoinusan の両方を含むデータを取得
      query = Analysis.where("url LIKE ? OR url LIKE ?", "%2029491573126574351%", "%2029180733114466495%")
    else
      query = Analysis.all
    end

    # 2. 🚀 取得したデータを「魔法の箱」で最新スコアに書き換える
    # これをやらないと、履歴画面で古い点数が出る
    @analyses = apply_latest_logic(query.order(created_at: :desc).limit(100).map(&:attributes))
    
    render json: { status: 'success', data: @analyses }
  end

  private

  # 🌟 Gemの計算をやり直して内訳をセットする共通メソッド
  # これを private の下に置く
  def apply_latest_logic(data_hashes)
    return [] if data_hashes.nil? || data_hashes.empty?
    
    # 1. Gemを呼び出して、現在のコード（勾配ロジック）で再計算！
    # DuplicateCheckerの中で score や is_zombie が上書きされる
    checker = ZombieDetector::DuplicateChecker.new(data_hashes)
    results = checker.analyze

    # 2. 各データに対して、Detectorで詳しい内訳(breakdown)を出し直す
    results.map do |res|
      detector = ZombieDetector::Detector.new(res)
      res['breakdown'] = detector.breakdown[:details]
      res
    end
  end
end