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
    zombie_score = ZombieDetector.score(user_data)
    is_zombie = ZombieDetector.zombie?(user_data)

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
      description: user_data['description']
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