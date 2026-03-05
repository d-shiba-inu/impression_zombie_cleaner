# app/services/x_api/client.rb
# rubocop:disable all

require 'time'
require 'json'
require 'faraday'

module XApi
  class Client
    BASE_URL = "https://api.twitter.com/2/users/by/username/"
    # 🌟 リプライ取得用のエンドポイント
    SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"
    TWEET_URL = "https://api.twitter.com/2/tweets"

    def fetch_user_data(username)
      # 🌟 URLからIDだけを抜き出す（安全策）
      # https://x.com/akindosushiroco -> akindosushiroco に変換
      clean_username = username.split('/').last.gsub('@', '')
      data = get_api_data("#{BASE_URL}#{clean_username}", { 'user.fields' => 'public_metrics,description,created_at,verified,name,pinned_tweet_id' })
      return nil if data.nil?

      # 固定ツイの情報もついでに取るワン
      pinned_info = fetch_pinned_tweet(data['pinned_tweet_id'])
      format_user_data(data, pinned_info)
    end

    # 🌟 引数に post_author_id を追加して、投稿主を除外
    def fetch_replies(tweet_id, post_author_id = nil)
      params = {
        'query' => "conversation_id:#{tweet_id} -is:retweet",
        'max_results' => 100, # まずは100件（無料/廉価枠の限界値）
        'tweet.fields' => 'author_id,created_at,text',
        'user.fields' => 'verified,verified_type,description,name,username,public_metrics,created_at,pinned_tweet_id',
        'expansions' => 'author_id' # 投稿主の情報も一緒に連れてくる
      }
    
      body = get_api_data(SEARCH_URL, params)
      return [] if body.nil? || body['data'].nil?

      # Expansionからユーザー情報を引く
      users = body.dig('includes', 'users')&.index_by { |u| u['id'] } || {}
      
      body['data'].map do |tweet|
        author_id = tweet['author_id']
        
        # 🌟 【判定】投稿主本人のリプライなら除外（スキップ）
        next if author_id == post_author_id

        user = users[author_id] || {}

        # 🌟 ユーザーごとに固定ツイート情報を取得（API回数に注意！）
        pinned_info = fetch_pinned_tweet(user['pinned_tweet_id'])
        
        format_user_data(user, pinned_info, tweet)
      end.compact # next で飛ばした nil を除去！
    end

    # 🌟 新設：固定ツイートの詳細を取得する
    def fetch_pinned_tweet(tweet_id)
      return nil if tweet_id.nil?
      # 単体ツイート取得時は data 直下にオブジェクトが来る
      data = get_api_data("#{TWEET_URL}/#{tweet_id}", { 'tweet.fields' => 'lang,text' })
      data.nil? ? nil : { 'lang' => data['lang'], 'text' => data['text'] }
    rescue
      nil
    end

    # ツイート詳細を取得するメソッド
    def fetch_tweet_author_id(tweet_id)
      data = get_api_data("#{TWEET_URL}/#{tweet_id}", { 'tweet.fields' => 'author_id' })
      data&.[]('author_id')
    end

    private

    # APIリクエストの共通化
    def get_api_data(url, params)
      conn = Faraday.new(url: url)
      response = conn.get do |req|
        req.headers['Authorization'] = "Bearer #{ENV.fetch('X_BEARER_TOKEN')}"
        req.params = params
      end
      return nil unless response.success?
      # X APIは基本 {"data": {...}} か {"data": [...]} で返る
      JSON.parse(response.body)['data']
    rescue
      nil
    end

    # データの整形（GemとDBが喜ぶ形に！）
    def format_user_data(user, pinned_info, tweet = nil)
      metrics = user['public_metrics'] || {}
      is_verified = user['verified'] == true
      
      # 言語判定
      reply_text = tweet ? tweet['text'] : ""
      reply_lang = CLD.detect_language(reply_text)[:code]
      # プロフィール + 名前の言語
      profile_text = "#{user['name']} #{user['description']}"
      profile_lang = CLD.detect_language(profile_text)[:code]

      {
        'text' => reply_text,
        'name' => user['name'],
        'screen_name' => user['username'],
        'description' => user['description'] || "",
        'verified' => is_verified,
        'badge_type' => determine_badge(user, is_verified),  # 👈 ここで色を決定！
        'followers_count' => metrics['followers_count'] || 0,
        'following_count' => metrics['following_count'] || 0,
        'statuses_count'  => metrics['tweet_count'] || 0, # 🌟 全投稿数
        'user_created_at' => user['created_at'], # 🌟 アカウント作成日
        'reply_lang' => reply_lang, # 🌟 本文の言語コード (ja, enなど)
        'profile_lang' => profile_lang, # 🌟 プロフィールの言語コード
        # 🌟 追加したカラム用データ
        'pinned_tweet_id' => user['pinned_tweet_id'],
        'pinned_tweet_text' => pinned_info&.[]('text'),
        'pinned_tweet_lang' => pinned_info&.[]('lang'),
        'raw_user_data' => user # 🌟 APIの生データをそのまま保存！
      }
    end

    def determine_badge(user, is_verified)
      return 'none' unless is_verified
      case user['verified_type']
      when 'business' then 'gold'
      when 'government' then 'government'
      else 'blue'
      end
    end
  end
end