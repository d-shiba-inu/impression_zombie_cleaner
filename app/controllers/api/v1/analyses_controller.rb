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
    demo_url = "https://x.com/minogashi205/status/2025474554320314713?sort_replies=recency"
    
    # A. デモモードかつ、知らないURLが来たらブロックする
    if ENV['DEMO_MODE'] == 'true' && tweet_url != demo_url
      render json: { 
        status: 'error', 
        message: '現在はデモ期間中につき、特定のURLのみ解析可能です。履歴から過去の解析結果を見るか、デモ用URLを試してほしいワン！🐾' 
      }, status: :forbidden
      return
    end

    # B. デモ用URLが来たら、APIを叩かずにDBから取得して返す
    if tweet_url == demo_url
      # 🌟 Analysisモデルから、このURLに一致するデータを取得
      stored_analyses = Analysis.where(url: demo_url).order(created_at: :desc)

      if stored_analyses.any?
        # Reactが期待する形式（@resultsと同じ形）に変換
        @results = stored_analyses.map do |r|
          # DBのデータをハッシュに変換し、Gemのキー名に合わせる
          r.attributes.merge({
            'is_zombie_copy' => r.is_zombie,
            'breakdown' => r.breakdown # JSON型なのでそのままハッシュとして扱える
          })
        end

        render json: {
          status: 'success',
          message: "デモ用データの取得に成功したワン！🐾",
          data: @results
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
    post_author_id = client.fetch_tweet_author_id(tweet_id) # 🌟 まず「投稿主のID」を特定する
    raw_replies = client.fetch_replies(tweet_id, post_author_id) # 🌟 引数に post_author_id を渡す！

    return render json: { status: 'success', data: [] } if raw_replies.empty?

    puts "DEBUG: User Data Sample >>> #{raw_replies.first.inspect}"

    # 3. 自作 Gem で判定(言語判定や密度判定のロジックも走る)
    @results = ZombieDetector.detect_duplicates(raw_replies)

    # 🌟 各リプライに「内訳」を付け加える
    @results.each do |res|
      # GemのDetectorクラスを呼び出して、詳細な内訳を取得
      detector = ZombieDetector::Detector.new(res)
      res['breakdown'] = detector.breakdown[:details] # { age: 10, lang: 30 ... } が入る
    end

    # 🌟 4. 判定結果を DB に一括保存（バルク・インサート）
    # map を使って保存用のデータ配列をスリムに作成します
    save_data = @results.map do |res|
      {
        url: tweet_url,
        name: res['name'],
        screen_name: res['screen_name'],
        text: res['text'],
        similarity_rate: res['similarity_rate'],
        is_zombie: res['is_zombie_copy'], # Gemのキー名に合わせる
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
    
    # 🌟 Rails 6以降の爆速保存メソッド
    Analysis.insert_all(save_data) if save_data.any?

    # 🌟 React に @results（内訳付き）を返す
    render json: {
      status: 'success',
      message: "#{raw_replies.size}件を解析・保存したワン！🐾",
      data: @results
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
    zombie_score = ZombieDetector.score(user_data) # detector を使ってスコア計算
    is_zombie = ZombieDetector.zombie?(user_data) # 判定

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
    # 🌟 最新の 50 件を、新しい順（desc）に取得
    @analyses = Analysis.order(created_at: :desc).limit(50)
    
    render json: {
      status: 'success',
      data: @analyses
    }
  end
end