# app/services/x_api/client.rb
module XApi
  class Client
    BASE_URL = "https://api.twitter.com/2/users/by/username/"
    # 🌟 リプライ取得用のエンドポイント
    SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"

    def fetch_user_data(username)
      # 🌟 URLからIDだけを抜き出す（安全策）
      # https://x.com/akindosushiroco -> akindosushiroco に変換
      clean_username = username.split('/').last.gsub('@', '')

      conn = Faraday.new(url: "#{BASE_URL}#{clean_username}") do |f|
        f.request :url_encoded
        f.adapter Faraday.default_adapter
      end

      response = conn.get do |req|
        req.headers['Authorization'] = "Bearer #{ENV.fetch('X_BEARER_TOKEN')}"
        # 🌟 ここでしっかり verified と name を要求する！
        req.params['user.fields'] = 'public_metrics,description,created_at,verified,name'
      end

      # 🌟 安全ガード：空レスポンスやパースエラーを防ぐ
      return nil if response.body.blank?
      
      begin
        body = JSON.parse(response.body)
      rescue JSON::ParserError
        return nil
      end

      return nil if !response.success? || body['data'].nil?

      data = body['data']
      metrics = data['public_metrics'] || {}

      # 🌟 戻り値のハッシュを DB のカラム名に合わせる
      {
        'name'            => data['name'],
        'screen_name'     => data['username'],
        'followers_count' => metrics['followers_count'] || 0,
        'following_count' => metrics['following_count'] || 0,
        'statuses_count'  => metrics['tweet_count'] || 0,
        'description'     => data['description'] || "",
        'created_at'      => data['created_at'] || Time.now.to_s,
        'verified'        => data['verified'] || false, # 🌟 これでチェックマークが取れる！
        'default_profile' => false
      }
    end

    # 🌟 引数に post_author_id を追加して、投稿主を除外
    def fetch_replies(tweet_id, post_author_id = nil)
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
        req.params['user.fields'] = 'verified,verified_type,description,name,username,public_metrics,created_at'
        req.params['expansions'] = 'author_id' # 投稿主の情報も一緒に連れてくる
      end

      return [] unless response.success?

      body = JSON.parse(response.body)
      return [] if body['data'].nil?

      # 🌟 データの整形（Gemが食べやすい形にマージ）
      # X API は「投稿データ」と「ユーザーデータ」が別々に届くので合体させます
      users = body.dig('includes', 'users')&.index_by { |u| u['id'] } || {}
      
      body['data'].map do |tweet|
        author_id = tweet['author_id']
        
        # 🌟 【判定】投稿主本人のリプライなら除外（スキップ）
        next if author_id == post_author_id

        user = users[tweet['author_id']] || {}

        # 認証バッジ判定
        # 1. シンプルに API が返してくる verified (true/false) を尊重する
        is_verified = user['verified'] == true

        # 2. 種類を判定（verified が false なら強制的に none）
        # React 側で色を変えやすいように種類を特定       
        v_type = user['verified_type']
        badge_type = if is_verified
                       case v_type
                       when 'business' then 'gold'
                       when 'government' then 'government'
                       else 'blue'
                       end
                     else
                       'none'
                     end

        # 🌟【新機能】言語判定 (CLDを使用)
        # リプライ本文の言語
        reply_lang = CLD.detect_language(tweet['text'])[:code]
        # プロフィール + 名前の言語
        profile_text = "#{user['name']} #{user['description']}"
        profile_lang = CLD.detect_language(profile_text)[:code]

        # 🌟 3. 【新機能】投稿密度（Activity Density）用のデータ準備
        metrics = user['public_metrics'] || {}
        user_created_at = user['created_at'] ? Time.parse(user['created_at']) : Time.now

        {
          'text' => tweet['text'],
          'verified' => is_verified,
          'badge_type' => badge_type,
          'description' => user['description'] || "",
          'created_at' => tweet['created_at'],  # ツイート投稿日
          'name' => user['name'] || "Unknown",        # ユーザーの表示名（例：スシロー）
          'screen_name' => user['username'] || "unknown_id", # ユーザーID（例：akindosushiroco）
          'followers_count' => user.dig('public_metrics', 'followers_count') || 0,
          'following_count' => user.dig('public_metrics', 'following_count') || 0,
          'statuses_count'  => metrics['tweet_count'] || 0, # 🌟 全投稿数
          'user_created_at' => user_created_at.to_s,       # 🌟 アカウント作成日
          'reply_lang'      => reply_lang,                 # 🌟 本文の言語コード (ja, enなど)
          'profile_lang'    => profile_lang                # 🌟 プロフィールの言語コード
        }
      end.compact # next で飛ばした nil を除去！
    end

    # ツイート詳細を取得するメソッド
    def fetch_tweet_author_id(tweet_id)
      url = "https://api.twitter.com/2/tweets/#{tweet_id}"
      conn = Faraday.new(url: url)
      response = conn.get do |req|
        req.headers['Authorization'] = "Bearer #{ENV.fetch('X_BEARER_TOKEN')}"
        req.params['tweet.fields'] = 'author_id'
      end
      return nil unless response.success?
      JSON.parse(response.body).dig('data', 'author_id')
    end
  end
end