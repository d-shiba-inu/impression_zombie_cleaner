class Api::V1::AnalysesController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    # 1. JSONファイルを読み込む
    file_path = Rails.root.join('db', 'mock_data', 'zombies.json')
    json_data = File.read(file_path)
    zombies = JSON.parse(json_data)

    # 2. 10個のサンプルデータからランダムに1つ選ぶ（擬似的な解析）
    mock_result = zombies.sample

    # 3. 選ばれたデータをReactに返す
    render json: {
      status: 'success',
      message: "Railsが解析を完了したワン！🐾",
      data: {
        screen_name: mock_result['screen_name'],
        description: mock_result['description'],
        is_zombie: mock_result['label'] == 'zombie', # zombieならtrue
        score: mock_result['label'] == 'zombie' ? 90 : 10, # とりあえず仮のスコア
        followers_count: mock_result['followers_count'],
        following_count: mock_result['following_count']
      }
    }
  end
end