# app/controllers/api/v1/analyses_controller.rb
class Api::V1::AnalysesController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    # 1. ユーザー入力を受け取る（将来的に React から来る値）
    # username = params[:username] || "zombie_target" 
    username = "zombie_target"

    # 2. 通訳さん（Service）を呼んでデータを取ってくる
    # ここで Client が JSON を読み込むか API を叩くかを隠蔽（隠して）くれます！
    client = XApi::Client.new
    user_data = client.fetch_user_data(username)

    # 3. 自作Gemにデータを渡して判定する
    zombie_score = ZombieDetector.score(user_data)
    is_zombie = ZombieDetector.zombie?(user_data)

    # 4. React に結果を返す
    render json: {
      status: 'success',
      message: "Railsが解析を完了したワン！🐾",
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