# app/services/x_api/client.rb
module XApi
  class Client
    BASE_URL = "https://api.twitter.com/2/users/by/username/"
    # 🌟 リプライ取得用のエンドポイント
    SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"

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

    def fetch_replies(tweet_id)
      conn = Faraday.new(url: SEARCH_URL) do |f|
        f.request :url_encoded
        f.adapter Faraday.default_adapter
      end

      response = conn.get do |req|
        req.headers['Authorization'] = "Bearer #{ENV.fetch('X_BEARER_TOKEN')}"
        # 🌟 ここがキモ！
        # conversation_id: そのツイートに紐づく会話を全取得
        # -is:retweet: リツイートは除外してスリムにする
        req.params['query'] = "conversation_id:#{tweet_id} -is:retweet"
        req.params['max_results'] = 100 # まずは100件（無料/廉価枠の限界値）
        req.params['tweet.fields'] = 'author_id,created_at,text'
        req.params['user.fields'] = 'verified,description,name,username'
        req.params['expansions'] = 'author_id' # 投稿主の情報も一緒に連れてくる
      end

      return [] unless response.success?

      body = JSON.parse(response.body)
      return [] if body['data'].nil?

      # 🌟 データの整形（Gemが食べやすい形にマージ）
      # X API は「投稿データ」と「ユーザーデータ」が別々に届くので合体させます
      users = body.dig('includes', 'users')&.index_by { |u| u['id'] } || {}
      
      body['data'].map do |tweet|
        user = users[tweet['author_id']] || {}
        {
          'text' => tweet['text'],
          'verified' => !!user['verified'],
          'description' => user['description'] || "",
          'created_at' => tweet['created_at'],
          'name' => user['name'] || "Unknown",        # ユーザーの表示名（例：スシロー）
          'screen_name' => user['username'] || "unknown_id" # ユーザーID（例：akindosushiroco）
        }
      end
    end
  end
end