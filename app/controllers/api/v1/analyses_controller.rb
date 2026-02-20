# app/controllers/api/v1/analyses_controller.rb
class Api::V1::AnalysesController < ApplicationController
  skip_before_action :verify_authenticity_token

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