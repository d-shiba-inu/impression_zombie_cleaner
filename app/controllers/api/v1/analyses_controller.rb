class Api::V1::AnalysesController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    # 1. JSONファイルを読み込む
    file_path = Rails.root.join('db', 'mock_data', 'zombies.json')
    zombies = JSON.parse(File.read(file_path))
    mock_result = zombies.sample

    # 🌟 ここで判定エンジンを動かす！
    # GemでZombieDetectorを定義
    zombie_score = ZombieDetector.score(mock_result)
    is_zombie = ZombieDetector.zombie?(mock_result)

    # 3. 選ばれたデータをReactに返す
    render json: {
      status: 'success',
      message: "Railsが解析を完了したワン！🐾",
      data: {
        screen_name: mock_result['screen_name'],
        description: mock_result['description'],
        is_zombie: zombie_score >= 50, # 50点以上ならゾンビ
        score: zombie_score,
        followers_count: mock_result['followers_count'],
        following_count: mock_result['following_count']
      }
    }
  end
end