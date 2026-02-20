# app/services/x_api/client.rb
module XApi
  class Client
    # APIから届く「生データ」を、Gemが求めている「文字列キー」の形式に変換する
    def fetch_user_data(username)
      # 🌟 本来はここで X API を叩きます（現在はモック）
      raw_api_response = mock_api_response(username)
      
      # 🌟 ここが「通訳（変換）」の肝！
      # APIのレスポンス（raw_api_response）を、Gemが期待する名前にマッピングします
      {
        'followers_count' => raw_api_response[:public_metrics][:followers_count],
        'following_count' => raw_api_response[:public_metrics][:following_count],
        'description' => raw_api_response[:description],
        'created_at' => raw_api_response[:created_at]
      }
    end

    private

    # X API v2 が返しそうなリアルな構造を模したダミーデータ
    def mock_api_response(username)
      {
        username: username,
        description: "相互フォロー 稼ぐ 副業",
        created_at: "2026-02-01T00:00:00Z",
        public_metrics: {
          followers_count: 10,
          following_count: 1000
        }
      }
    end
  end
end