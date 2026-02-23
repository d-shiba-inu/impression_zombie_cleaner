# app/controllers/api/v1/analyses_controller.rb
class Api::V1::AnalysesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # テスト用JSONを読み込んで一括解析するアクション
  # 🌟 本番用の一括解析アクション
  def index
    # 1. フロントから届いた URL を解析して Tweet ID を抜き出す
    # 例: https://x.com/username/status/123456789 -> 123456789
    tweet_url = params[:url]
    
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
    raw_replies = client.fetch_replies(tweet_id)

    if raw_replies.empty?
      render json: { status: 'success', message: 'リプライが見つからなかったワン！', data: [] }
      return
    end

    # 3. 自作 Gem で一括解析（類似度計算 & ゾンビ判定）
    # D-2 で実装した UI が期待する形式で返却します
    @results = ZombieDetector.detect_duplicates(raw_replies)

    render json: {
      status: 'success',
      message: "#{raw_replies.size}件のリプライを本番解析したワン！🐾",
      data: @results
    }
  end

  # 特定のユーザー1人を検証するアクション
  def create
    # 1. ユーザー入力を受け取る（React の input に入れた値が params[:url] で届きます）
    username = params[:url]

    # 2. 通訳さん（Service）を呼んでデータを取ってくる
    client = XApi::Client.new
    user_data = client.fetch_user_data(username)

    # 🛡️ 安全装置：データが取れなかった（nilだった）場合の処理
    if user_data.nil?
      render json: { 
        status: 'error', 
        message: 'ユーザーが見つからなかったワン... IDが間違っていないか確認してほしいワン！🐶' 
      }, status: :not_found
      return # 👈 ここで処理を中断して、下の解析に進ませない！
    end

    # 3. 自作Gemにデータを渡して判定する
    zombie_score = ZombieDetector.score(user_data)
    is_zombie = ZombieDetector.zombie?(user_data)

    # 4. React に結果を返す
    render json: {
      status: 'success',
      message: "Railsが本物のXからデータを取ってきたワン！🐾",
      data: {
        screen_name: user_data['screen_name'],
        description: user_data['description'],
        is_zombie: is_zombie,
        score: zombie_score,
        followers_count: user_data['followers_count'],
        following_count: user_data['following_count']
      }
    }
  end
end