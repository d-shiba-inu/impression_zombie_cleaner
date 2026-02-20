# app/services/x_api/client.rb
module XApi
  class Client
    BASE_URL = "https://api.twitter.com/2/users/by/username/"

    def fetch_user_data(username)
      # 🌟 @が入っていたら取り除く（安全対策）
      clean_username = username.gsub('@', '')

      conn = Faraday.new(url: "#{BASE_URL}#{clean_username}") do |f|
        f.request :url_encoded
        f.adapter Faraday.default_adapter
      end

      response = conn.get do |req|
        req.headers['Authorization'] = "Bearer #{ENV.fetch('X_BEARER_TOKEN')}"
        req.params['user.fields'] = 'public_metrics,description,created_at'
      end

      # 通信失敗、またはデータがない場合は即座に nil を返す
      body = JSON.parse(response.body)
      return nil if !response.success? || body['data'].nil?

      data = body['data']
      metrics = data['public_metrics'] || {}

      {
        'screen_name'     => data['username'],
        'followers_count' => metrics['followers_count'] || 0,
        'following_count' => metrics['following_count'] || 0,
        'statuses_count'  => metrics['tweet_count'] || 0,
        'description'     => data['description'] || "",
        'created_at'      => data['created_at'] || Time.now.to_s,
        'default_profile' => false
      }
    end
  end
end